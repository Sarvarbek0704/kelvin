import * as React from "react"

const NetworkIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.width ?? 22}
    height={props.height ?? 22}
    fill="none"
    viewBox="0 0 22 22"
    {...props}
  >
    <path
      stroke={props.color ?? "#454545"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M1 21v-5m6.667 5V11m6.666 10V6M21 21V1"
    />
  </svg>
)

export default NetworkIcon
