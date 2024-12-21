import { state } from '../index'

export function load<T extends object>(action: () => Promise<{ error?: boolean; data?: T }>) {
  const container: { loading: boolean; error: boolean; data?: T } = state({
    loading: true,
    error: false,
    data: undefined,
  })

  async function loadData() {
    const { error, data } = await action()

    container.loading = false

    if (error) {
      container.error = error
    } else {
      container.data = data
    }
  }

  loadData()

  return container
}
