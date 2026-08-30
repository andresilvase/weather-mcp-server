# Weather MCP Server

The `weather-mcp-server` is an MCP server that retrieves weather alerts and forecasts from the National Weather Service API.

## Requirements

- Node.js 18 or newer
- An MCP-compatible client

## Installation

```bash
npm install
npm run build
```

The compiled server is written to `build/index.js`.

## MCP client configuration

Configure your MCP client to launch the built server over stdio. For example:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/absolute/path/to/weather/build/index.js"]
    }
  }
}
```

Replace the path with the absolute path to this project.

## Used In

This MCP Server is being used in [mcp-client](https://github.com/andresilvase/mcp-client).

## Available tools

### `get_alerts`

Returns active weather alerts for a US state.

Input:

- `state`: two-letter state code, such as `CA`

### `get_forecast`

Returns the forecast for a geographic location.

Input:

- `latitude`: number from `-90` to `90`
- `longitude`: number from `-180` to `180`

## Data source

Weather data is provided by the [National Weather Service API](https://api.weather.gov/).

## License

ISC