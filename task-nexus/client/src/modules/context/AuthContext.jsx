import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("nexus_token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(`${API_BASE}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUser(res.data.user ?? res.data);
            } catch (err) {
                setUser(null);
                localStorage.removeItem("nexus_token");
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [token]);

    const login = async (email, password) => {
        const res = await axios.post(`${API_BASE}/api/auth/login`, {
            email,
            password,
        });

        localStorage.setItem("nexus_token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user ?? null);

        return res.data;
    };

    const register = async (username, email, password) => {
        const res = await axios.post(`${API_BASE}/api/auth/register`, {
            username,
            email,
            password,
        });

        localStorage.setItem("nexus_token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user ?? null);

        return res.data;
    };

    const logout = () => {
        localStorage.removeItem("nexus_token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, token, loading, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
