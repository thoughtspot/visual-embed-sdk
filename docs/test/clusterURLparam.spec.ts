jest.setTimeout(50000);

describe('Navigation to URL param in Query:', () => {
    const link = 'https://www.thoughtspot.com';

    beforeAll(async () => {
        await page.goto(`${URL}?link=${link}`, {
            waitUntil: 'networkidle2',
        });
    });

    it('should contain a tag with link', async () => {
        const selectedElement = await page.$(`a[href="${link}"]`);
        expect(selectedElement).not.toBeNull();
    });
});
