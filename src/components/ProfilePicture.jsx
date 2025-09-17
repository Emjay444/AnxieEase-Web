import React, { useState, useEffect } from "react";
import { generateAvatar, getFullName } from "../utils/helpers";
import { supabase } from "../services/supabaseClient";

/*
  Flexible ProfilePicture component
  Accepts either:
    - patient: full object with name + avatar_url
    - OR individual props: userId, name, avatarUrl
  This avoids breakage where callers passed userId/name directly.
*/
const ProfilePicture = ({
  patient,
  userId,
  name,
  avatarUrl: directAvatarUrl,
  size = 48,
  className = "",
  showInitials = true,
  debug = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [avatarServiceError, setAvatarServiceError] = useState(false);
  const [resolved, setResolved] = useState(() => {
    if (patient) return patient;
    return { id: userId, name: name, avatar_url: directAvatarUrl };
  });

  // Update resolved object if incoming props change
  useEffect(() => {
    if (patient) {
      setResolved(patient);
    } else if (userId || name || directAvatarUrl) {
      setResolved({ id: userId, name, avatar_url: directAvatarUrl });
    }
  }, [patient, userId, name, directAvatarUrl]);

  const sizeClasses = {
    32: "h-8 w-8",
    40: "h-10 w-10",
    48: "h-12 w-12",
    64: "h-16 w-16",
    96: "h-24 w-24",
    128: "h-32 w-32",
  };
  const textSizeClasses = {
    32: "text-sm",
    40: "text-base",
    48: "text-lg",
    64: "text-xl",
    96: "text-2xl",
    128: "text-3xl",
  };

  useEffect(() => {
    setImgError(false);
    setAvatarServiceError(false);
  }, [resolved?.avatar_url]);

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || avatarUrl === "NULL") return null;
    if (avatarUrl.startsWith("http")) return avatarUrl;
    try {
      const { data } = supabase.storage.from("avatars").getPublicUrl(avatarUrl);
      return data.publicUrl;
    } catch (e) {
      console.error("ProfilePicture: public URL error", e);
      return null;
    }
  };

  if (!resolved) {
    return (
      <div
        className={`${
          sizeClasses[size] || "h-12 w-12"
        } rounded-full bg-gray-200 flex items-center justify-center ${className}`}
      >
        <span
          className={`text-gray-500 font-medium ${
            textSizeClasses[size] || "text-lg"
          }`}
        >
          ?
        </span>
      </div>
    );
  }

  const fullName = getFullName(resolved);

  const customAvatarUrl = getAvatarUrl(resolved.avatar_url);
  const hasCustomAvatar = !!customAvatarUrl;
  const generatedAvatarUrl = !hasCustomAvatar
    ? generateAvatar(fullName, size)
    : null;

  if (debug) {
    console.log("[ProfilePicture]", {
      fullName,
      avatar: resolved.avatar_url,
      customAvatarUrl,
      hasCustomAvatar,
      generatedAvatarUrl,
      imgError,
      avatarServiceError,
    });
  }

  const sizeClass = sizeClasses[size] || "h-12 w-12";
  const textSizeClass = textSizeClasses[size] || "text-lg";

  // Show initials if: custom avatar failed, external service failed, or no avatar available
  if (
    imgError ||
    avatarServiceError ||
    (!hasCustomAvatar && !generatedAvatarUrl)
  ) {
    const initials =
      fullName && fullName !== "Unknown"
        ? fullName
            .split(" ")
            .map((n) => n.charAt(0))
            .join("")
            .toUpperCase()
            .substring(0, 2)
        : "?";
    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ${className}`}
      >
        <span className={`text-white font-bold ${textSizeClass}`}>
          {initials}
        </span>
      </div>
    );
  }

  const finalUrl = hasCustomAvatar ? customAvatarUrl : generatedAvatarUrl;

  return (
    <div className={`relative ${className}`}>
      <img
        src={finalUrl}
        alt={`${fullName} profile`}
        className={`${sizeClass} rounded-full object-cover`}
        onError={() => {
          if (hasCustomAvatar) {
            setImgError(true);
          } else {
            setAvatarServiceError(true);
          }
        }}
        loading="lazy"
      />
    </div>
  );
};

export default ProfilePicture;
