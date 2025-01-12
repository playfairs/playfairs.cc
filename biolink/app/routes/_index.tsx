import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import fs from "fs/promises";
import path from "path";
import { Client } from "discord.js";

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

// Social links configuration
const SOCIAL_LINKS = [
  {
    name: "GitHub",
    url: "https://github.com/playfairs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    )
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/playfairs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.784 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    )
  },
  {
    name: "Twitter",
    url: "https://twitter.com/playfairs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
      </svg>
    )
  },
  {
    name: "Discord",
    url: "https://discord.gg/heresy",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.54 0c1.356 0 2.46 1.104 2.46 2.472v21.528l-2.58-2.28-1.452-1.344-1.536-1.428.636 2.22h-13.608c-1.356 0-2.46-1.104-2.46-2.472v-16.224c0-1.368 1.104-2.472 2.46-2.472h16.08zm-4.632 15.672c2.652-.084 3.672-1.824 3.672-1.824 0-3.864-1.728-7.008-1.728-7.008-1.728-1.296-3.372-1.26-3.372-1.26l-.168.192c2.04.624 2.988 1.524 2.988 1.524-1.248-.684-2.472-1.02-3.612-1.152-.864-.096-1.692.012-2.424.048l-.204.024c-.42.036-1.44.192-2.724.756-.444.204-.708.348-.708.348s.996-.948 3.156-1.572l-.12-.144s-1.644-.036-3.372 1.26c0 0-1.728 3.144-1.728 7.008 0 0 1.008 1.74 3.66 1.824 0 0 .444-.54.804-.996-1.524-.456-2.1-1.416-2.1-1.416l.336.204.048.036.047.027.014.006.047.027c.3.168.6.306.876.42.492.192 1.08.384 1.764.516.9.168 1.956.228 3.096.012.564-.096 1.14-.264 1.74-.516.42-.156.888-.384 1.38-.708 0 0-.6.984-2.172 1.428.36.456.792.972.792.972zm-5.58-5.604c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332.012-.732-.54-1.332-1.224-1.332zm4.38 0c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332 0-.732-.54-1.332-1.224-1.332z"/>
      </svg>
    )
  }
];

export const loader = async () => {
  try {
    // Fetch GitHub projects
    const githubResponse = await fetch('https://api.github.com/users/playfairs/repos', {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const githubProjects = await githubResponse.json();

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
        const client = new Client();
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
      },
      githubProjects: githubProjects.map((project) => ({
        name: project.name,
        description: project.description,
        url: project.html_url,
        stars: project.stargazers_count,
        language: project.language
      })).filter(project => !project.name.includes('template') && !project.name.includes('example'))
    };
  } catch {
    return { 
      landing: DEFAULT_CONFIG, 
      discord: DEFAULT_DISCORD_CONFIG,
      githubProjects: []
    };
  }
};

export const meta: MetaFunction = () => {
  return [
    { title: "Playfairs.cc - Professional Network" },
    { name: "description", content: "Professional networking and showcase platform" },
  ];
};

export default function Index() {
  const { landing: config, discord, githubProjects } = useLoaderData<typeof loader>();

  return (
    <div className={`min-h-screen ${config.backgroundColor} ${config.textColor} flex flex-col`}>
      {/* GitHub Projects Slider */}
      {githubProjects.length > 0 && (
        <div className="w-full bg-gray-800 py-2 overflow-hidden relative group">
          <div className="flex animate-slide-left group-hover:pause-animation">
            {[...githubProjects, ...githubProjects].map((project, index) => (
              <a 
                key={`${project.name}-${index}`} 
                href={project.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-shrink-0 mx-4 text-sm text-gray-300 hover:text-white transition duration-300"
              >
                {project.name} 
                {project.language && ` (${project.language})`}
                {project.stars > 0 && ` ★ ${project.stars}`}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-16 flex-grow flex items-center justify-center">
        <div className="max-w-4xl w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex">
          {/* Left Side - Profile & Avatar */}
          <div className="w-1/3 bg-gray-700 p-8 flex flex-col items-center">
            {discord.user && discord.user.avatarURL && (
              <div className="w-32 h-32 mb-6 rounded-full border-4 border-blue-400 overflow-hidden">
                <img 
                  src={discord.user.avatarURL} 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-blue-300 mb-2">
              {config.title || "Developer"}
            </h2>
            
            <div className="flex justify-center space-x-4 mt-4">
              {SOCIAL_LINKS.map((social) => (
                <a 
                  key={social.name} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition duration-300 ease-in-out transform hover:scale-110"
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Right Side - About Me & Message */}
          <div className="w-2/3 p-8">
            <h3 className="text-3xl font-bold text-blue-400 mb-4">About Me</h3>
            
            <p className="text-gray-300 mb-6">
              {config.subtitle || "Passionate developer exploring the intersection of technology and creativity. Always learning, always growing."}
            </p>

            <div className="bg-gray-700 rounded-lg p-6 mb-6">
              <h4 className="text-xl font-semibold text-blue-300 mb-4">
                Professional Interests
              </h4>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Web Development</li>
                <li>Open Source Contributions</li>
                <li>Innovative Technology Solutions</li>
              </ul>
            </div>

            <Link 
              to="/message" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Send Me a Message
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-gray-800 text-gray-400 py-4 text-center">
        <p>&copy; 2025 Playfairs.cc. All rights reserved.</p>
      </footer>

      {/* Tailwind CSS for animation */}
      <style>{`
        @keyframes slide-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-slide-left {
          animation: slide-left 20s linear infinite;
        }
        .group:hover .pause-animation {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
