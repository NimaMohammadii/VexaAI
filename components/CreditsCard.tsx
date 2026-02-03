import type { UserProfile } from "@/store/useUserStore";

export const CreditsCard = ({ user }: { user: UserProfile }) => (
  <div className="card">
    <h3 style={{ fontSize: 20 }}>Credits</h3>
    <p style={{ fontSize: 36, marginTop: 12 }}>{user.credits}</p>
    <p className="subtle" style={{ marginTop: 8 }}>
      Credits are deducted based on total characters per request.
    </p>
  </div>
);
