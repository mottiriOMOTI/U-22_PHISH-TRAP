import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.vue'

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a><slot /></a>',
  },
  useRoute: () => ({
    meta: {},
    path: '/',
  }),
}))

vi.mock('../api/settings', () => ({
  fetchAppSettings: vi.fn().mockResolvedValue({ themeColor: 1 }),
}))

describe('App', () => {
  it('mounts the application shell', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const wrapper = mount(App, {
      global: {
        stubs: {
          NotifyCenter: true,
          RouterLink: true,
          RouterView: true,
          VApp: { template: '<div><slot /></div>' },
          VContainer: { template: '<div><slot /></div>' },
          VMain: { template: '<main><slot /></main>' },
        },
      },
    })

    expect(wrapper.find('.app-main').exists()).toBe(true)
  })
})
