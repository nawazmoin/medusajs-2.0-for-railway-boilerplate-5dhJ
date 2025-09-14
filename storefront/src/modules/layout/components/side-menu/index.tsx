"use client"

import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import {
  XMark,
  ChevronRightMini,
  MagnifyingGlass,
  ShoppingBag,
  ArrowRightMini,
} from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import { HttpTypes } from "@medusajs/types"

type Props = {
  regions: HttpTypes.StoreRegion[] | null
  cartCount?: number
  logo?: React.ReactNode // pass your logo component if you want
}

/**
 * Responsive slide-in menu (Kavinn-style):
 * - Mobile: full screen
 * - ≥sm: left sheet with fixed max width
 * - Row separators, chevrons on items with children
 * - Top bar: Close · Search · Logo · Cart
 * - Footer: CountrySelect + ©, Auth link
 */
const SideMenu = ({ regions, cartCount = 0, logo }: Props) => {
  const [open, setOpen] = useState(false)
  const regionToggle = useToggleState()

  // Configure your menu here (use hasChildren to show chevron)
  const ITEMS: { label: string; href: string; hasChildren?: boolean }[] = [
    { label: "🔥 SALE", href: "/collections/sale" },
    { label: "Personalisierte Geschenke", href: "/collections/personalisierte-geschenke" },
    { label: "Baby und Kindergeschenke", href: "/collections/baby-und-kindergeschenke" },
    { label: "Frauengeschenke", href: "/collections/frauengeschenke" },
    { label: "Männergeschenke", href: "/collections/männergeschenke" },
    { label: "Anlassgeschenke", href: "/collections/anlassgeschenke" },
    { label: "Gastgeschenke", href: "/collections/gastgeschenke" },
    { label: "Kundeninspirationen", href: "/collections/kundeninspirationen" },
    { label: "Weitere Geschenke", href: "/collections/weitere-geschenke" },
  ]
  return (
    <>
      {/* Trigger – put this in your header */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="h-full px-3 text-ui-fg-subtle hover:text-ui-fg-base"
      >
        Menü
      </button>

      <Transition show={open} as={Fragment}>
        <Dialog onClose={setOpen} className="relative z-50">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          {/* Panel (left sheet) */}
          <Transition.Child
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="-translate-x-full opacity-0"
            enterTo="translate-x-0 opacity-100"
            leave="transition ease-in duration-150"
            leaveFrom="translate-x-0 opacity-100"
            leaveTo="-translate-x-full opacity-0"
          >
            <Dialog.Panel
              className={clx(
                "fixed inset-y-0 left-0 flex h-full w-full flex-col bg-white text-ui-fg-base shadow-2xl",
                "sm:max-w-[520px] md:max-w-[560px]" // wide phones/tablets get a nice sheet width
              )}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <button
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                    className="p-2 -m-2"
                  >
                    <XMark />
                  </button>

                  <LocalizedClientLink
                    href="/search"
                    className="p-2 -m-2 hover:text-ui-fg-subtle"
                    onClick={() => setOpen(false)}
                  >
                    <MagnifyingGlass />
                  </LocalizedClientLink>
                </div>

                <div className="select-none text-xl tracking-wide">
                  {logo ?? (
                    <LocalizedClientLink
                      href="/"
                      className="font-medium"
                      onClick={() => setOpen(false)}
                    >
                      Art&nbsp;of&nbsp;Gifts
                    </LocalizedClientLink>
                  )}
                </div>

                <LocalizedClientLink
                  href="/cart"
                  className="relative p-2 -m-2 hover:text-ui-fg-subtle"
                  onClick={() => setOpen(false)}
                >
                  <ShoppingBag />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-ui-bg-interactive text-[10px] font-medium text-ui-fg-on-color">
                      {cartCount}
                    </span>
                  )}
                </LocalizedClientLink>
              </div>

              {/* Divider */}
              <hr className="border-ui-border" />

              {/* Scroll area with menu items */}
              <nav className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-ui-border">
                  {ITEMS.map((item) => (
                    <li key={item.label}>
                      <LocalizedClientLink
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={clx(
                          "flex items-center justify-between px-5 py-4",
                          "text-base tracking-wide hover:bg-ui-bg-subtle"
                        )}
                      >
                        <span>{item.label}</span>
                        {item.hasChildren && (
                          <ChevronRightMini className="shrink-0" />
                        )}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Footer */}
              <div className="mt-auto border-t border-ui-border px-5 py-5 space-y-5">
                <div
                  className="flex items-center justify-between"
                  onMouseEnter={regionToggle.open}
                  onMouseLeave={regionToggle.close}
                >
                  {regions && (
                    <CountrySelect
                      toggleState={regionToggle}
                      regions={regions}
                    />
                  )}
                  <ArrowRightMini
                    className={clx(
                      "transition-transform duration-150",
                      regionToggle.state ? "-rotate-90" : ""
                    )}
                  />
                </div>

                <LocalizedClientLink
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="block text-sm underline underline-offset-4 hover:text-ui-fg-subtle"
                >
                  Registrieren / Anmelden
                </LocalizedClientLink>

                <Text className="txt-compact-small text-ui-fg-muted">
                  © {new Date().getFullYear()} Art of Gifts. Alle Rechte vorbehalten.
                </Text>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  )
}

export default SideMenu
