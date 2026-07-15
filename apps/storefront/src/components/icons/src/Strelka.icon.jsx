import * as React from "react";
const Strelka = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={39}
    height={26}
    fill="none"
    {...props}
  >
    <g stroke="#000" opacity={0.3}>
      <path d="M11 13h17m-17 0 5.037-5M11 13l5.037 5" />
      <rect width={38} height={25} x={0.5} y={0.5} rx={12.5} />
    </g>
  </svg>
);
export default Strelka;
