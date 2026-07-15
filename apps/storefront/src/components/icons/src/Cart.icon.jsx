import * as React from "react"

const CartIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.width ?? 26}
    height={props.width ?? 26}
    fill="none"
    viewBox="0 0 26 26"
    {...props}
  >
    <path
      stroke={props.color ?? "#454545"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.667 19.667a2.667 2.667 0 1 0 0 5.333 2.667 2.667 0 0 0 0-5.333Zm0 0h-9.334a4 4 0 0 1-4-2.667L3.667 1H1m18.667 18.667a4 4 0 0 0 4-2.667L25 7.667H4.733m6.934 14.666a2.667 2.667 0 1 1-5.334 0 2.667 2.667 0 0 1 5.334 0Z"
    />
  </svg>
)

export default CartIcon
