'use client';

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { useAuth } from "../auth/AuthProvider";
import { Group } from "../../lib/types";
import GroupCard from "../../components/GroupCard";
import GroupSearch from "../../components/GroupSearch";
import LoadingScreen from "../../components/LoadingScreen";
import MotherScreen from "../../components/MotherScreen";

export default function ChatHomePage() {
  const [currentStage, setCurrentStage] = useState<'loading' | 'mother' | 'chat'>('loading');
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, signIn, signOut } = useAuth();
  const [email, setEmail] = useState<string>("");
  const router = useRouter();

  // Sequence: Loading → Mother → Chat
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setCurrentStage('mother');
    }, 2200);

    const motherTimer = setTimeout(() => {
      setCurrentStage('chat');
    }, 8200); // Mother screen shows for 6 seconds

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(motherTimer);
    };
  }, []);

  useEffect(() => {
    if (user && currentStage === 'chat') {
      fetchGroups();
    }
  }, [user, currentStage]);

  async function fetchGroups() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else {
      setGroups(data || []);
      setFilteredGroups(data || []);
    }
    setLoading(false);
  }

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await signIn(email);
    setEmail("");
  };

  const handleJoinGroup = (groupId: string) => {
    router.push(`/chat/groups/${groupId}`);
  };

  const handleSearchResults = (results: Group[]) => {
    setFilteredGroups(results);
  };

  const handleSelectGroupFromSearch = (groupId: string) => {
    router.push(`/chat/groups/${groupId}`);
  };

  const handleMotherComplete = () => {
    setCurrentStage('chat');
  };

  const handleResetFilters = () => {
    setFilteredGroups(groups);
  };

  // Render loading stages
  if (currentStage === 'loading') {
    return <LoadingScreen />;
  }

  if (currentStage === 'mother') {
    return <MotherScreen onComplete={handleMotherComplete} />;
  }

  // Main chat interface (after MOTHER screen)
  return (
    <div className="relative min-h-screen bg-black text-green-400 overflow-hidden font-mono">
      {/* CRT Screen Effects */}
      <div className="absolute inset-0">
        {/* Scanlines */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-screen" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.1) 2px,
              rgba(0, 255, 0, 0.1) 4px
            )`,
            animation: 'scan 10s linear infinite'
          }} />
        </div>

        {/* Screen curvature effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 70%)" />

        {/* Static noise */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9Ii4wNSIvPjwvc3ZnPg==')]" />
        </div>
      </div>

      {/* Terminal Border */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Alien-style Header */}
        <div className="border border-green-800/50 rounded-lg p-1 mb-8 bg-black/90">
          <div className="border border-green-900/30 rounded p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <div className="text-green-500 text-sm tracking-widest">WEYLAND-YUTANI CORPORATION</div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-green-400 tracking-tight">
                  NOSTROMO COMMUNICATION NETWORK
                </h1>
                <div className="flex items-center gap-4 mt-3 text-green-600 text-sm">
                  <span>SHIP ID: 180246</span>
                  <span>•</span>
                  <span>STATUS: ONLINE</span>
                  <span>•</span>
                  <span>SECURITY: OMEGA</span>
                </div>
              </div>

              {/* Auth Section - Alien Style */}
              <div className="border border-green-800/30 rounded p-4 bg-black/50">
                {user ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="text-green-300 text-sm font-mono max-w-[200px] truncate">
                        CREW: {user.email}
                      </div>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="px-4 py-2 border border-green-700 text-green-300 rounded hover:bg-green-900/30 transition-all duration-300 hover:border-green-500 font-mono text-sm"
                    >
                      LOGOUT
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSignIn} className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="ENTER CREW EMAIL"
                      className="flex-1 bg-black border border-green-700 px-4 py-2 rounded text-green-300 font-mono text-sm focus:outline-none focus:border-green-500 placeholder-green-800"
                      type="email"
                    />
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-900/30 border border-green-700 text-green-300 font-mono text-sm rounded hover:bg-green-800/30 hover:border-green-500 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      AUTHENTICATE
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Search Component */}
            <div className="mt-6">
              <GroupSearch
                groups={groups}
                onSearchResults={handleSearchResults}
                onSelectGroup={handleSelectGroupFromSearch}
                placeholder="SCAN FOR COMMUNICATION CHANNELS..."
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="border border-green-800/30 rounded-lg p-1 bg-black/90 mb-8">
          <div className="border border-green-900/20 rounded p-6 md:p-8">
            {/* Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-green-900/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-mono text-sm tracking-widest">MOTHER ONLINE</span>
                </div>
                <span className="text-green-800">•</span>
                <span className="text-green-600 font-mono text-sm">
                  {filteredGroups.length} ACTIVE CHANNEL{filteredGroups.length !== 1 ? 'S' : ''}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {filteredGroups.length !== groups.length && (
                  <>
                    <div className="hidden md:flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-green-700 text-sm font-mono">
                        FILTERED: {filteredGroups.length}/{groups.length}
                      </span>
                    </div>
                    <span className="text-green-900">•</span>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 text-sm font-mono">QUANTUM ENCRYPTED</span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {!user && (
              <div className="text-center py-16">
                <div className="text-2xl font-bold text-green-300 mb-4 tracking-widest">
                  CREW AUTHENTICATION REQUIRED
                </div>
                <p className="text-green-700 max-w-md mx-auto mb-8 font-mono">
                  Access restricted to authorized Weyland-Yutani personnel only.
                </p>
                <div className="inline-flex items-center gap-2 text-green-800">
                  <div className="w-4 h-4 border-2 border-green-800 border-t-green-500 rounded-full animate-spin"></div>
                  <span className="font-mono text-sm">Awaiting credentials...</span>
                </div>
              </div>
            )}

            {/* Loading Groups */}
            {user && loading && (
              <div className="py-16">
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-green-800 border-t-green-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-black rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-xl text-green-300 mb-2 tracking-widest animate-pulse">
                    SCANNING COMMUNICATION CHANNELS...
                  </div>
                  <p className="text-green-700 text-sm font-mono">
                    Accessing Nostromo mainframe database
                  </p>
                </div>
              </div>
            )}

            {/* No Groups */}
            {user && !loading && groups.length === 0 && (
              <div className="text-center py-16">
                <div className="text-3xl text-green-600 mb-6 tracking-widest">
                  NO ACTIVE CHANNELS
                </div>
                <p className="text-green-700 max-w-md mx-auto mb-8 font-mono">
                  Communication network silent. Establish first transmission channel.
                </p>
                <div className="inline-block">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-green-800 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-800 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-green-800 rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            )}

            {/* No Search Results */}
            {user && !loading && groups.length > 0 && filteredGroups.length === 0 && (
              <div className="text-center py-16">
                <div className="text-3xl text-green-600 mb-6 tracking-widest">
                  NO CHANNELS FOUND
                </div>
                <p className="text-green-700 max-w-md mx-auto mb-8 font-mono">
                  No communication channels match your search criteria.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-3 border border-green-700 text-green-300 rounded hover:bg-green-900/30 transition-all duration-300 hover:scale-105 active:scale-95 font-mono text-sm"
                >
                  SHOW ALL CHANNELS
                </button>
              </div>
            )}

            {/* Groups Grid */}
            {user && !loading && filteredGroups.length > 0 && (
              <div>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h2 className="text-2xl font-bold text-green-400 tracking-widest">
                      COMMUNICATION CHANNELS
                    </h2>
                    {filteredGroups.length !== groups.length && (
                      <span className="text-green-600 text-sm">
                        (FILTERED RESULTS)
                      </span>
                    )}
                  </div>
                  <p className="text-green-600 font-mono text-sm">
                    Select channel for secure interstellar communication
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map((group, index) => (
                    <div
                      key={group.id}
                      className="transform transition-all duration-300 hover:scale-[1.02]"
                    >
                      <GroupCard
                        group={group}
                        onJoin={handleJoinGroup}
                        showJoinButton={true}
                        showDetails={true}
                        variant={index % 3 === 0 ? 'priority' : 'default'}
                      />
                    </div>
                  ))}
                </div>

                {/* Stats Footer */}
                <div className="mt-12 pt-8 border-t border-green-900/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border border-green-800/30 rounded bg-black/50">
                      <div className="text-3xl font-bold text-green-400">{filteredGroups.length}</div>
                      <div className="text-green-600 text-sm font-mono mt-1 tracking-wider">ACTIVE CHANNELS</div>
                    </div>
                    <div className="text-center p-4 border border-green-800/30 rounded bg-black/50">
                      <div className="text-3xl font-bold text-green-400">256-bit</div>
                      <div className="text-green-600 text-sm font-mono mt-1 tracking-wider">ENCRYPTION</div>
                    </div>
                    <div className="text-center p-4 border border-green-800/30 rounded bg-black/50">
                      <div className="text-3xl font-bold text-green-400">99.9%</div>
                      <div className="text-green-600 text-sm font-mono mt-1 tracking-wider">UPTIME</div>
                    </div>
                    <div className="text-center p-4 border border-green-800/30 rounded bg-black/50">
                      <div className="text-3xl font-bold text-green-400">0ms</div>
                      <div className="text-green-600 text-sm font-mono mt-1 tracking-wider">LATENCY</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border border-green-800/30 rounded-lg p-4 text-center bg-black/50">
          <p className="text-green-800 text-sm font-mono tracking-wider">
            © 2124 WEYLAND-YUTANI CORPORATION • PROPRIETARY TECHNOLOGY
          </p>
          <p className="text-green-900 text-xs font-mono mt-2">
            All communications monitored and recorded for security purposes
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <span className="text-green-800 text-xs">SHIP TIME: 23:47:18</span>
            <span className="text-green-800 text-xs">•</span>
            <span className="text-green-800 text-xs">LOCATION: LV-426 SYSTEM</span>
            <span className="text-green-800 text-xs">•</span>
            <span className="text-green-800 text-xs">TEMP: -89°C</span>
          </div>
        </div>

        {/* System Monitor */}
        <div className="mt-8 p-4 border border-green-800/30 rounded bg-black/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-green-400 text-sm font-mono">SYSTEM MONITOR</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="h-2 bg-green-900/50 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-green-500 rounded-full w-3/4 animate-pulse"></div>
              </div>
              <div className="text-green-600 text-xs">CPU LOAD</div>
            </div>
            <div className="text-center">
              <div className="h-2 bg-green-900/50 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-green-500 rounded-full w-1/2 animate-pulse"></div>
              </div>
              <div className="text-green-600 text-xs">MEMORY</div>
            </div>
            <div className="text-center">
              <div className="h-2 bg-green-900/50 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-green-500 rounded-full w-5/6 animate-pulse"></div>
              </div>
              <div className="text-green-600 text-xs">POWER</div>
            </div>
            <div className="text-center">
              <div className="h-2 bg-green-900/50 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-green-500 rounded-full w-2/3 animate-pulse"></div>
              </div>
              <div className="text-green-600 text-xs">OXYGEN</div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Line Input */}
      <div className="fixed bottom-8 left-0 right-0 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 px-4 py-3 border border-green-800/50 rounded-lg bg-black/90 backdrop-blur-sm">
            <span className="text-green-500 font-mono">NOSTROMO:</span>
            <span className="text-green-700">~</span>
            <span className="text-green-400">$</span>
            <input
              type="text"
              placeholder="Type 'help' for commands..."
              className="flex-1 bg-transparent border-none outline-none text-green-300 font-mono placeholder-green-800"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget.value.toLowerCase();
                  if (input === 'help') {
                    alert('Available commands:\n• status - System status\n• logs - View ship logs\n• crew - List crew members\n• channels - List communication channels\n• clear - Clear terminal');
                  } else if (input === 'status') {
                    alert('System Status:\n• Power: 100%\n• Life Support: Optimal\n• Navigation: Online\n• Communications: Secure\n• Crew: All present');
                  } else if (input === 'channels') {
                    e.currentTarget.value = `Found ${filteredGroups.length} channels`;
                  } else if (input === 'clear') {
                    e.currentTarget.value = '';
                  }
                  e.currentTarget.value = '';
                }
              }}
            />
            <div className="w-2 h-4 bg-green-500 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Inline styles */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }

        .animate-scan {
          animation: scan 10s linear infinite;
        }

        /* Custom scrollbar for Alien theme */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 255, 0, 0.05);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 0, 0.2);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 0, 0.3);
        }

        /* Selection color */
        ::selection {
          background: rgba(0, 255, 0, 0.3);
          color: #00ff00;
        }

        /* Text glow for terminal text */
        .text-glow {
          text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        /* CRT flicker effect */
        @keyframes crt-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.98; }
        }

        .crt-flicker {
          animation: crt-flicker 0.1s infinite;
        }
      `}</style>
    </div>
  );
}