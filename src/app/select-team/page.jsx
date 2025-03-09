"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import io from "socket.io-client";

const SelectTeamPage = () => {
  const [players, setPlayers] = useState([]);
  const [team, setTeam] = useState([]);
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const socket = io("http://localhost:3001");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch team data
        const teamRes = await fetch("/api/team");
        if (!teamRes.ok) {
          router.push("/login");
          return;
        }
        const teamData = await teamRes.json();
        setTeam(teamData.team);

        const playersRes = await fetch("/api/players");
        setPlayers(await playersRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("teamUpdate", () => {
      fetchData();
    });

    return () => {
      socket.off("teamUpdate");
      socket.disconnect();
    };
  }, [router]);

  const addPlayer = async (player) => {
    if (team.some((p) => p._id === player._id)) {
      toast.error("Player already in your team!");
      return;
    }

    if (team.length >= 11) {
      toast.error("Your team is already full!");
      return;
    }

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player._id }),
      });

      if (!res.ok) {
        throw new Error("Failed to add player");
      }

      toast.success("Player added to your team");
    } catch (error) {
      console.error("Error adding player:", error);
      toast.error(error.message);
    }
  };

  const filteredPlayers = category
      ? players.filter((p) => p.category === category)
      : players;

  return (
      <div className="max-w-4xl mx-auto mt-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Select Your Team ({team.length}/11)
        </h1>

        <div className="mb-6">
          <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full max-w-lg p-2 border-gray-300 rounded-lg shadow-sm"
          >
            <option value="">All Categories</option>
            <option value="Batsman">Batsman</option>
            <option value="All-Rounder">All-Rounder</option>
            <option value="Bowler">Bowler</option>
          </select>
        </div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
              {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow h-32"></div>
              ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredPlayers.map((player) => (
                  <div
                      key={player._id}
                      className="bg-white p-4 rounded-lg shadow transition-transform hover:transform hover:scale-105"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{player.university}</p>
                    <p className="mt-2 font-semibold">Rs. {player.value.toLocaleString()}</p>
                    <button
                        onClick={() => addPlayer(player)}
                        className={`btn-primary mt-3 w-full ${
                            team.length >= 11 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={team.length >= 11}
                    >
                      Add to Team
                    </button>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
};

export default SelectTeamPage;