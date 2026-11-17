import { PasswordCard } from "./PasswordCard";
import { ProfileCard } from "./ProfileCard";

export default function SettingsPage() {
  return (
    <section aria-label="Settings" className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-6">
        <h1 className="px-1 text-lg font-semibold">Account settings</h1>
        <ProfileCard />
        <PasswordCard />
      </div>
    </section>
  );
}
