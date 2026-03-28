import React, { createContext, useContext, useReducer, useCallback } from "react";

const CommunityContext = createContext(null);

const initialState = {
    lostFoundItems:    [],
    emergencies:       [],
    tutoringSessions:  [],
    skills:            [],
    qaPosts:           [],
    complaints:        [],
    notices:           [],
    moodLogs:          [],
    activeSOS:         null, // current active SOS for banner
    loading:           false,
    error:             null,
};

function communityReducer(state, action) {
    switch (action.type) {
        case "SET_LOADING":    return { ...state, loading: action.payload };
        case "SET_ERROR":      return { ...state, error: action.payload };

        case "SET_LOSTFOUND":  return { ...state, lostFoundItems:   action.payload };
        case "ADD_LOSTFOUND":  return { ...state, lostFoundItems:   [action.payload, ...state.lostFoundItems] };

        case "SET_EMERGENCIES":return { ...state, emergencies:      action.payload };
        case "ADD_EMERGENCY":  return { ...state, emergencies:      [action.payload, ...state.emergencies] };
        case "SET_ACTIVE_SOS": return { ...state, activeSOS:        action.payload };
        case "CLEAR_ACTIVE_SOS":return { ...state, activeSOS:       null };

        case "SET_TUTORING":   return { ...state, tutoringSessions: action.payload };
        case "SET_SKILLS":     return { ...state, skills:           action.payload };
        case "SET_QA":         return { ...state, qaPosts:          action.payload };
        case "SET_COMPLAINTS": return { ...state, complaints:       action.payload };
        case "SET_NOTICES":    return { ...state, notices:          action.payload };
        case "SET_MOOD_LOGS":  return { ...state, moodLogs:         action.payload };

        default: return state;
    }
}

export const CommunityProvider = ({ children }) => {
    const [state, dispatch] = useReducer(communityReducer, initialState);

    const setActiveSOS = useCallback((emergency) => {
        dispatch({ type: "SET_ACTIVE_SOS", payload: emergency });
    }, []);

    const clearActiveSOS = useCallback(() => {
        dispatch({ type: "CLEAR_ACTIVE_SOS" });
    }, []);

    return (
        <CommunityContext.Provider value={{ state, dispatch, setActiveSOS, clearActiveSOS }}>
            {children}
        </CommunityContext.Provider>
    );
};

export const useCommunity = () => {
    const ctx = useContext(CommunityContext);
    if (!ctx) throw new Error("useCommunity must be used within CommunityProvider");
    return ctx;
};
