# Roblox DevEx Rate Split

A small Chrome/Chromium extension for `https://create.roblox.com/dashboard/devex`.

It reads the displayed eligible Robux total and displayed USD value, then solves:

- `x + y = totalRobux`
- `0.0038x + 0.0054y = totalUsd`

where `x` is the Robux valued at $0.0038 and `y` is the Robux valued at $0.0054.

## Install locally

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository folder.
6. Open or refresh `https://create.roblox.com/dashboard/devex`.

The extension does not make network requests and does not access cookies or Roblox credentials. It only reads the visible DevEx page and adds the calculated split to the page.

## Example

For 2,087,258 eligible Robux worth $8,216.94, the algebra gives approximately:

- 1,908,908 Robux at $0.0038
- 178,350 Robux at $0.0054

The displayed USD total is rounded to cents, so the exact solution can contain a fractional Robux. The extension displays the nearest whole Robux.
