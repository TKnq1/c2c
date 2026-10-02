import { SidePanel } from "@/components/side-panel";

// Opens the panel straight away while the profile loads.
export default function ProfilePanelLoading() {
  return (
    <SidePanel label="Loading profile">
      <div className="flex animate-pulse flex-col gap-5" aria-hidden>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 rounded-full bg-fog" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-6 w-2/3 rounded bg-fog" />
            <div className="h-5 w-1/3 rounded bg-fog" />
          </div>
        </div>
        <div className="h-11 rounded-full bg-fog" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded bg-fog" />
          ))}
        </div>
        <div className="h-24 rounded bg-fog" />
      </div>
    </SidePanel>
  );
}
