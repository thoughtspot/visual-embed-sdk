import React from "react"
import renderer from "react-test-renderer"
import { fireEvent, render } from "@testing-library/react"

import Dropdown from "./index"
import { opt_out_tracking } from "mixpanel-browser"

describe("Dropdown", () => {
  window.open = jest.fn();
  const location = {
    href: {
      replace: jest.fn().mockReturnValue('/'),
    },
    pathname: '/visual-embed-sdk/release/en',
  };

  it("should renders correctly", () => {
    const tree = renderer
      .create(<Dropdown location={location} />)
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('should redirect to new url on click', () => {
    const { getByTestId } = render(<Dropdown location={location} />);
    const option = getByTestId('option-Cloud');
    fireEvent.click(option);
    expect(location.href.replace).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith('/', '_self');
  })
})