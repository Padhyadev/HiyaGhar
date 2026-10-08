using System.Collections.Concurrent;

namespace Hiya2.Server.Services
{
    public interface IUserSessionTracker
    {
        void RegisterSession(long userId, string sessionId);
        bool IsSessionValid(long userId, string sessionId);
        void InvalidateSession(long userId);
    }

    public class UserSessionTracker : IUserSessionTracker
    {
        // Tracks UserId -> Active SessionId (Guid)
        private readonly ConcurrentDictionary<long, string> _activeSessions = new();

        public void RegisterSession(long userId, string sessionId)
        {
            _activeSessions[userId] = sessionId;
        }

        public bool IsSessionValid(long userId, string sessionId)
        {
            if (string.IsNullOrEmpty(sessionId)) return false;

            // If the user has an active session tracked, match it exactly (single-device enforcement)
            if (_activeSessions.TryGetValue(userId, out var activeSessionId))
            {
                return string.Equals(activeSessionId, sessionId, StringComparison.Ordinal);
            }

            // Session not found in memory (e.g., server just restarted and memory was cleared).
            // The JWT is cryptographically valid (already verified by JwtBearer middleware),
            // so we trust it and register it as the current active session.
            // This self-healing prevents spurious logouts after server restarts.
            _activeSessions[userId] = sessionId;
            return true;
        }

        public void InvalidateSession(long userId)
        {
            _activeSessions.TryRemove(userId, out _);
        }
    }
}
