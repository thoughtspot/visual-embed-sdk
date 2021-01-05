import * as React from "react"

// styles
const pageStyles = {
  color: "#232129",
  padding: "96px",
  fontFamily: "-apple-system, Roboto, sans-serif, serif",
}
const test = {
  width: "100%",
  height: 600,
  display: "flex"
}

// markup
const IndexPage = () => {
  return (
    <div>
      <header style={{ height: 50, width: "100%", borderBottom: "1px solid black" }}>
        <img src="" alt="logo" style={{ width: 200 }} />
        <input type="text" title="search" style={{ margin: 10, width: 200 }} />
      </header>
      <div style={test}>
        <div style={{ width: "20%", borderRight: "1px solid black", display: "inline-flex" }}>Left Navigation</div>
        <div style={{ width: "65%", borderRight: "1px solid black", display: "inline-flex" }}>Main Content</div>
        <div style={{ width: "15%", display: "inline-flex" }}>On Page Right Navigation</div>
      </div>
    </div>
  )
}

export default IndexPage
