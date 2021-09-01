import React from "react"
import renderer from "react-test-renderer"
import { render } from "@testing-library/react"

import Button from "./index"

describe("button", () => {
  const testLabel = 'Test label';
  const testType = `Button`;

  it("should renders correctly", () => {
    const tree = renderer
      .create(<Button label={testLabel} type={testType} />)
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  it(`renders label correctly`, () => {
    const { getByTestId } = render(<Button label={testLabel} type={testType} />)

    const label = getByTestId("btn")

    expect(label).toBeInTheDocument()
  })
})