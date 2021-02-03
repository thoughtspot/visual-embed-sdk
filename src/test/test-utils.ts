export const getDocumentBody = () => '<div id="embed"></div>';

export const getRootEl = () => document.getElementById('embed');

export const getIFrameEl = () => document.querySelector('iframe');

export const getIFrameSrc = () => getIFrameEl().src;
