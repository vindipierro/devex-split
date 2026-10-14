# Roblox DevEx Rate Split

A small Chrome/Chromium extension for `https://create.roblox.com/dashboard/devex`.

It reads the displayed eligible Robux total and displayed USD value, then solves:

- `x + y = totalRobux`
- `0.0038x + 0.0054y = totalUsd`

where `x` is the eligible Robux valued at $0.0038 and `y` is the eligible Robux valued at $0.0054.

## Important limitation

This calculation assumes all eligible Robux shown on the DevEx page are valued at either **$0.0038** or **$0.0054** per Robux.

If your eligible balance contains any legacy Robux valued at **$0.0035**, the calculated split will be incorrect. With three possible rates and only the total eligible Robux and total USD value, there is not enough information to uniquely determine how much belongs to each rate.

Robux that are not DevEx eligible do not affect the calculation because the extension reads Roblox's displayed **eligible Robux** amount rather than your total account balance.

## Install locally

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository folder.
6. Open or refresh `https://create.roblox.com/dashboard/devex`.

The extension does not make network requests and does not access cookies or Roblox credentials. It only reads the visible DevEx page and adds the calculated split to the page.

The displayed USD total is rounded to cents, so the algebraic solution can contain fractional Robux. The extension displays the nearest whole Robux.
