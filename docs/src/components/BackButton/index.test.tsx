import React from "react"
import renderer from "react-test-renderer"
import { render } from "@testing-library/react"

import BackButton from "./index"

describe("BackButton", () => {
  const testTitle = 'Test Title';
  const testBackLink = `test backlink`;

  it("it should renders correctly", () => {
    const tree = renderer
      .create(<BackButton title={testTitle} backLink={testBackLink} />)
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  it(`renders title correctly`, () => {
    const { getByTestId } = render(<BackButton title={testTitle} backLink={testBackLink} />)

    const title = getByTestId("backBtn")

    expect(title).toBeInTheDocument()
  })
})