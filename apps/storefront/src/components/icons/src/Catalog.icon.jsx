import * as React from "react"

const CatalogIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.width ?? 25}
    height={props.height ?? 16}
    fill="none"
    viewBox="0 0 25 16"
    {...props}
  >
    <path stroke={props.color ?? "#fff"} strokeWidth={2} d="M0 1h25M0 8h18M0 15h25" />
  </svg>
)

export default CatalogIcon
