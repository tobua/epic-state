import { state } from '../index'

export function load<T extends object | string | number | boolean>(action: () => Promise<{ error?: boolean; data?: T }>) {
  const container: { loading: boolean; error: boolean; data: T } = state({
    loading: true,
    error: false,
    // Up to the user to ensure loading and error properties are checked before accessing data.
    data: undefined as unknown as T,
  })

  async function loadData() {
    const { error, data } = await action()

    container.loading = false

    if (error || !data) {
      container.error = true
    } else {
      container.data = data
    }
  }

  loadData()

  return container
}
