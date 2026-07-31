const tailwindConfig = require('../tailwind.config');

describe('tenant branding tokens', () => {
  test('maps shared brand and legacy palettes to runtime CSS variables', () => {
    const colors = tailwindConfig.theme.extend.colors;

    expect(colors.brand[600]).toBe('var(--color-primary-600)');
    expect(colors.brand.contrast).toBe('var(--color-primary-contrast)');
    expect(colors.emerald[600]).toBe('var(--color-primary-600)');
    expect(colors.teal[700]).toBe('var(--color-primary-700)');
  });
});
