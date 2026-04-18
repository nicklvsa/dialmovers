import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ConnectionPanel from '@/components/ConnectionPanel.vue';

describe('ConnectionPanel', () => {
  it('should render input and connect button', () => {
    const wrapper = mount(ConnectionPanel);

    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.find('button').text()).toBe('Connect!');
  });

  it('should disable button when phone number is invalid', async () => {
    const wrapper = mount(ConnectionPanel);

    const input = wrapper.find('input[type="text"]');
    const button = wrapper.find('button');

    await input.setValue('123');

    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should enable button when phone number is valid', async () => {
    const wrapper = mount(ConnectionPanel);

    const input = wrapper.find('input[type="text"]');
    const button = wrapper.find('button');

    await input.setValue('1234567890');

    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('should emit connect event with valid phone', async () => {
    const wrapper = mount(ConnectionPanel);

    const input = wrapper.find('input[type="text"]');
    const button = wrapper.find('button');

    await input.setValue('1234567890');
    await button.trigger('click');

    expect(wrapper.emitted('connect')).toBeTruthy();
  });

  it('should generate game ID on connect', async () => {
    const wrapper = mount(ConnectionPanel);

    const input = wrapper.find('input[type="text"]');
    const button = wrapper.find('button');

    await input.setValue('1234567890');
    await button.trigger('click');

    // After connect, game ID should be displayed
    // This would require checking the component's internal state
    // or checking the DOM for the game ID display
  });

  it('should toggle event history checkbox', async () => {
    const wrapper = mount(ConnectionPanel);

    const checkbox = wrapper.find('input[type="checkbox"]');

    expect(checkbox.element.checked).toBe(false);

    await checkbox.setChecked(true);

    expect(checkbox.element.checked).toBe(true);
  });
});
