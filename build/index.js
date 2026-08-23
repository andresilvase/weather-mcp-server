import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather/1.0";
const server = new McpServer({
    name: "weather",
    version: "1.0.0",
});
// Helper function for making NWS API requests
async function makeNWSRequest(url) {
    const headers = {
        "User-Agent": USER_AGENT,
        Accept: "application/geo+json",
    };
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making NWS request:", error);
        return null;
    }
}
// Format alert data
function formatAlert(feature) {
    const props = feature.properties;
    return [
        `Event: ${props.event || "Unknown"}`,
        `Area: ${props.areaDesc || "Unknown"}`,
        `Severity: ${props.severity || "Unknown"}`,
        `Status: ${props.status || "Unknown"}`,
        `Headline: ${props.headline || "No headline"}`,
        "---",
    ].join("\n");
}
server.registerTool("get_alerts", {
    "description": "Get weather alerts for a given latitude and longitude.",
    "inputSchema": z.object({
        state: z.string().length(2).describe("Two-letter state code (e.g., 'CA' for California)"),
    })
}, async ({ state }) => {
    const stateCode = state.toUpperCase();
    const alertsUrl = `${NWS_API_BASE}/alerts/active?area=${stateCode}`;
    const alertsData = await makeNWSRequest(alertsUrl);
    if (!alertsData) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve weather data."
                }
            ]
        };
    }
    const features = alertsData.features || [];
    if (!features.length) {
        return {
            content: [
                {
                    type: "text",
                    text: `No active weather alerts for ${stateCode}.`
                }
            ]
        };
    }
    const formattedAlerts = features.map(formatAlert);
    const alertsText = `Active Weather Alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;
    return {
        content: [
            {
                type: "text",
                text: alertsText
            }
        ]
    };
});
server.registerTool("get_forecast", {
    "description": "Get the weather forecast for a location.",
    inputSchema: z.object({
        latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
        longitude: z.number().min(-180).max(180).describe("Longitude of the location"),
    })
}, async ({ latitude, longitude }) => {
    const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const pointsData = await makeNWSRequest(pointsUrl);
    if (!pointsData) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to retrieve grid point data for coordinates (${latitude}, ${longitude}).`
                }
            ]
        };
    }
    const forecastUrl = pointsData.properties.forecast;
    if (!forecastUrl) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to get forecast URL."
                }
            ]
        };
    }
    const forecastData = await makeNWSRequest(forecastUrl);
    if (!forecastData) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve forecast data."
                }
            ]
        };
    }
    const periods = forecastData.properties.periods || [];
    if (periods.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: "No forecast data available."
                }
            ]
        };
    }
    const formattedForecasts = periods.map(period => {
        return [
            `Period: ${period.name || "Unknown"}`,
            `Temperature: ${period.temperature ?? "Unknown"} ${period.temperatureUnit || ""}`,
            `Wind: ${period.windSpeed || "Unknown"} from ${period.windDirection || "Unknown"}`,
            `Forecast: ${period.shortForecast || "No forecast available"}`,
            "---",
        ].join("\n");
    });
    const forecastText = `Weather Forecast for (${latitude}, ${longitude}):\n\n${formattedForecasts.join("\n")}`;
    return {
        content: [
            {
                type: "text",
                text: forecastText
            }
        ]
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
