
export function useScrollEnd(callback: CallableFunction, interval = 200) {
  const timer: number[] = []

  function scrolled(ev: Event) {
    shiftEach(timer, clearTimeout)

    timer.push(
      setTimeout(
        () => {
          shiftEach(timer, clearTimeout)
          callback(ev)
        },
        interval
      )
    )
  }

  function shiftEach(array: any[], callback: CallableFunction) {
    for (let i = 0; i < array.length; i++) {
      callback(array.shift())
    }
  }

  return {
    scrolled
  }
}