import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import fs from "fs/promises";
import path from "path";
import { Client } from "discord.js-selfbot-v13";

// Paths to configuration files
const CONFIG_PATH = path.join(process.cwd(), "app", "landing-config.json");
const DISCORD_CONFIG_PATH = path.join(process.cwd(), "app", "discord-config.json");

// Default configurations
const DEFAULT_CONFIG = {
  title: "Playfairs.cc",
  subtitle: "",
  backgroundColor: "bg-gray-900",
  textColor: "text-gray-100",
  accentColor: "text-blue-400"
};

const DEFAULT_DISCORD_CONFIG = {
  userId: "",
  botToken: "",
  displayName: "",
  avatarUrl: "",
  status: "",
  customStatus: ""
};

export const loader = async () => {
  try {
    // Read configurations
    const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
    const landingConfig = JSON.parse(configContent);

    let discordConfig;
    try {
      const discordConfigContent = await fs.readFile(DISCORD_CONFIG_PATH, "utf-8");
      discordConfig = JSON.parse(discordConfigContent);
    } catch {
      discordConfig = DEFAULT_DISCORD_CONFIG;
    }

    // If Discord configuration is provided, fetch user details
    let discordUser = null;
    if (discordConfig.userId && discordConfig.botToken) {
      try {
        const client = new Client({ checkUpdate: false });
        await client.login(discordConfig.botToken);
        
        // Fetch user
        discordUser = await client.users.fetch(discordConfig.userId);
        
        // Close the client
        await client.destroy();
      } catch (error) {
        console.error("Discord fetch error:", error);
      }
    }

    return { 
      landing: landingConfig, 
      discord: {
        ...discordConfig,
        user: discordUser ? {
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatarURL: discordUser.avatarURL() || discordConfig.avatarUrl,
          status: discordUser.presence?.status || discordConfig.status
        } : null
      }
    };
  } catch {
    return { 
      landing: DEFAULT_CONFIG, 
      discord: DEFAULT_DISCORD_CONFIG 
    };
  }
};

export const meta: MetaFunction = () => {
  return [
    { title: "Playfairs.cc - A simple Biolink made in HTML and CSS" },
    { name: "description", content: "Professional networking and showcase platform" },
  ];
};

export default function Index() {
  const { landing: config, discord } = useLoaderData<typeof loader>();

  return (
    <div className={`min-h-screen ${config.backgroundColor} ${config.textColor} flex flex-col items-center justify-center p-4`}>
      <div className="max-w-2xl w-full bg-gray-800 shadow-2xl rounded-xl p-8 text-center">
        <h1 className={`text-4xl font-bold ${config.accentColor} mb-4`}>
          {config.title}
        </h1>
        <p className="text-gray-300 mb-8">
          {config.subtitle}
        </p>
        
        <div className="space-y-4">
          {discord.user && (
            <div className="bg-gray-700 p-6 rounded-lg flex items-center justify-center space-x-4">
              {discord.user.avatarURL && (
                <img 
                  src={discord.user.avatarURL} 
                  alt="Discord Avatar" 
                  className="w-16 h-16 rounded-full border-2 border-blue-400"
                />
              )}
              <div className="text-left">
                <h3 className="text-xl font-semibold text-blue-300">
                  {discord.user.username}#{discord.user.discriminator}
                </h3>
                <p className="text-gray-400 capitalize">
                  Status: {discord.user.status || 'Unknown'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">
              Coming Soon
            </h2>
            <p className="text-gray-400">
              Our platform is currently under development. Stay tuned for an exciting professional networking experience.
            </p>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>Empowering professionals, one profile at a time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
