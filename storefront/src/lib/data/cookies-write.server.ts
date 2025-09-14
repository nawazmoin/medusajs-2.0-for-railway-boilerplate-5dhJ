"use server"
import { cookies } from "next/headers"

export const setCartId = (id: string) =>
    cookies().set("_medusa_cart_id", id, { path: "/", sameSite: "lax" })

export const removeCartId = () =>
    cookies().set("_medusa_cart_id", "", { maxAge: -1, path: "/" })
