import React from "react";
import PropTypes from "prop-types";

const rotations = {
  right: "0",
  down: "90",
  left: "180",
  up: "-90",
};

function ChevronIcon({
  direction = "right",
  size = 20,
  color = "currentColor",
  ...props
}) {
  const rotation = rotations[direction] || "0";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotation}deg)` }}
      {...props}
    >
      <path
        d="M7 5l5 5-5 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

ChevronIcon.propTypes = {
  direction: PropTypes.oneOf(["right", "left", "up", "down"]),
  size: PropTypes.number,
  color: PropTypes.string,
};

export default ChevronIcon;
