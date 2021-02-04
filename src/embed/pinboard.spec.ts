import { PinboardEmbed } from './pinboard';
import { init } from '../index';
import { Action, AuthType } from '../types';
import { getDocumentBody, getIFrameSrc, getRootEl } from '../test/test-utils';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const pinboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const vizId = '6e73f724-660e-11eb-ae93-0242ac130002';
const thoughtSpotHost = 'tshost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

describe('Pinboard/viz embed tests', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should render pinboard', () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), defaultViewConfig);
        pinboardEmbed.render({
            pinboardId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true#/embed/viz/${pinboardId}`,
        );
    });

    test('should render viz', () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), defaultViewConfig);
        pinboardEmbed.render({
            pinboardId,
            vizId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true#/embed/viz/${pinboardId}/${vizId}`,
        );
    });
});
