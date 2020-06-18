import * as React from "react"
import { render, unmountComponentAtNode } from "react-dom"
import { World } from "@javelin/ecs"
import {
  JavelinMessage,
  SerializedSchema,
  serializeWorldModel,
  SerializedComponentType,
} from "@javelin/net"
import { Devtool } from "./components/devtool"
import { WorldConfig } from "./types"
import { WorldProvider } from "./context/world_provider"
import { useCallback } from "react"

export type WorldsConfig = { [name: string]: World }

export type DevtoolOptions = {
  worlds: WorldsConfig
  onMessage: (world: World, message: JavelinMessage) => unknown
}

export type Devtool = {
  mount(root: HTMLElement): void
  unmount(): void
  setModel(world: World, model: SerializedSchema[]): void
}

export function createDevtool(options: DevtoolOptions): Devtool {
  const worlds: WorldConfig[] = Object.entries(options.worlds).map(
    ([name, world]) => ({
      name,
      world,
      model: serializeWorldModel(world),
    }),
  )

  function Root() {
    const onMessage = (world: WorldConfig, message: JavelinMessage) =>
      options.onMessage(options.worlds[world.name], message)

    return (
      <WorldProvider worlds={worlds} onMessage={onMessage}>
        <Devtool />
      </WorldProvider>
    )
  }

  let element: HTMLElement
  let interval: number

  function update() {
    render(Root(), element)
  }

  function mount(root: HTMLElement) {
    element = root
    update()
    interval = setInterval(update, 500)
  }

  function unmount() {
    clearInterval(interval)
    unmountComponentAtNode(element)
  }

  function setModel(world: World, model: SerializedComponentType[]) {
    const config = worlds.find(config => config.world === world)

    if (config === undefined) {
      throw new Error("Cannot set model: world not registered with devtool")
    }

    config.model = model
  }

  return {
    mount,
    unmount,
    setModel,
  }
}
