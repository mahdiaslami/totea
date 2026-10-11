import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useKeyboard } from '../useKeyboard'

describe('useKeyboard composable', () => {
  it('provides reactive keyboard state and methods', () => {
    const TestComponent = defineComponent({
      setup() {
        const { isKeyboardOpen, keyboardHeight, hideKeyboard } = useKeyboard()
        return { isKeyboardOpen, keyboardHeight, hideKeyboard }
      },
      render() {
        return h('div', { id: 'test' }, `Open: ${this.isKeyboardOpen}, Height: ${this.keyboardHeight}`)
      },
    })

    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toContain('Open: false, Height: 0')
    expect(typeof wrapper.vm.hideKeyboard).toBe('function')
    wrapper.unmount()
  })

  it('safely handles hideKeyboard call', async () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    const blurSpy = vi.spyOn(input, 'blur')

    const TestComponent = defineComponent({
      setup() {
        const { hideKeyboard } = useKeyboard()
        return { hideKeyboard }
      },
      render() {
        return h('div')
      },
    })

    const wrapper = mount(TestComponent)
    await wrapper.vm.hideKeyboard()
    expect(blurSpy).toHaveBeenCalled()
    wrapper.unmount()
    input.remove()
  })
})
