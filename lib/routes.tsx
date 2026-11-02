export enum Routes {
  HOME = "/",
  ROOM = "/room",
}

export function roomPath(roomId: string) {
  return `${Routes.ROOM}/${roomId}`
}
