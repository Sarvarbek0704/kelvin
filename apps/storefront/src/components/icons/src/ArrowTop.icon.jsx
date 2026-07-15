import * as React from "react";
const ArrowTopIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    fill="none"
    {...props}
  >
    <path
      stroke={props.color ?? "black"}
      strokeWidth={2}
      d="M.707 1h16m0 0v16m0-16-16 16"
    />
  </svg>
);
export default ArrowTopIcon;
