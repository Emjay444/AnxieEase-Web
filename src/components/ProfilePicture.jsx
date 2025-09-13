import React, { useState, useEffect } from 'react';
import { generateAvatar } from '../utils/helpers';
import { supabase } from '../services/supabaseClient';

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
  className = '',
  showInitials = true,
  debug = false
}) => {
  const [imgError, setImgError] = useState(false);
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

  const sizeClasses = { 32: 'h-8 w-8', 40: 'h-10 w-10', 48: 'h-12 w-12', 64: 'h-16 w-16' };
  const textSizeClasses = { 32: 'text-sm', 40: 'text-base', 48: 'text-lg', 64: 'text-xl' };

  useEffect(() => { setImgError(false); }, [resolved?.avatar_url]);

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || avatarUrl === 'NULL') return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    try {
      const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
      return data.publicUrl;
    } catch (e) {
      console.error('ProfilePicture: public URL error', e);
      return null;
    }
  };

  if (!resolved || !resolved.name) {
    return (
      <div className={`${sizeClasses[size] || 'h-12 w-12'} rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
        <span className={`text-gray-500 font-medium ${textSizeClasses[size] || 'text-lg'}`}>?</span>
      </div>
    );
  }

  const customAvatarUrl = getAvatarUrl(resolved.avatar_url);
  const hasCustomAvatar = !!customAvatarUrl;
  const finalUrl = hasCustomAvatar ? customAvatarUrl : generateAvatar(resolved.name || 'Unknown User', size);

  if (debug) {
    console.log('[ProfilePicture]', { name: resolved.name, avatar: resolved.avatar_url, customAvatarUrl, hasCustomAvatar, finalUrl });
  }

  const sizeClass = sizeClasses[size] || 'h-12 w-12';
  const textSizeClass = textSizeClasses[size] || 'text-lg';

  if (imgError || (!hasCustomAvatar && showInitials && !resolved.name)) {
    return (
      <div className={`${sizeClass} rounded-full bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center ${className}`}>
        <span className={`text-emerald-600 font-medium ${textSizeClass}`}>{resolved.name ? resolved.name.charAt(0).toUpperCase() : '?'}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={finalUrl}
        alt={`${resolved.name} profile`}
        className={`${sizeClass} rounded-full object-cover`}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    </div>
  );
};

export default ProfilePicture;