import mongoose from "mongoose";

// Simple in-memory cache with TTL
class Cache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, ttlMs = 300000) { // Default 5 minutes TTL
        const expiresAt = Date.now() + ttlMs;
        this.cache.set(key, { value, expiresAt });

        // Auto-cleanup after TTL
        setTimeout(() => {
            this.cache.delete(key);
        }, ttlMs);
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    // Get cache stats
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Create cache instances
export const eventsCache = new Cache();
export const eventDetailsCache = new Cache();

// Cache keys
export const CACHE_KEYS = {
    ALL_EVENTS: 'all_events',
    EVENT_DETAIL: (id) => `event_detail_${id}`,
    USER_EVENTS: (userId) => `user_events_${userId}`,
    MY_TICKETS: (userId) => `my_tickets_${userId}`
};

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
    EVENTS_LIST: 5 * 60 * 1000,     // 5 minutes
    EVENT_DETAIL: 10 * 60 * 1000,   // 10 minutes
    USER_DATA: 2 * 60 * 1000,       // 2 minutes
};

// Cache invalidation helpers
export const invalidateEventCache = (eventId = null) => {
    if (eventId) {
        // Invalidate specific event
        eventsCache.delete(CACHE_KEYS.ALL_EVENTS);
        eventDetailsCache.delete(CACHE_KEYS.EVENT_DETAIL(eventId));
    } else {
        // Invalidate all events
        eventsCache.clear();
        eventDetailsCache.clear();
    }
};

export const invalidateUserCache = (userId) => {
    eventsCache.delete(CACHE_KEYS.USER_EVENTS(userId));
    eventsCache.delete(CACHE_KEYS.MY_TICKETS(userId));
};

// Database change listeners for cache invalidation
export const setupCacheInvalidation = () => {
    // Listen for Event model changes
    const Event = mongoose.model('Event');

    // Invalidate cache when events are modified
    Event.watch().on('change', (change) => {
        console.log('Event change detected, invalidating cache:', change.operationType);
        invalidateEventCache(change.documentKey?._id?.toString());
    });

    // Listen for Ticket model changes (affects user tickets)
    const Ticket = mongoose.model('Ticket');
    Ticket.watch().on('change', (change) => {
        console.log('Ticket change detected, invalidating user cache');
        // We can't easily determine which user, so clear all user caches
        eventsCache.clear();
    });
};