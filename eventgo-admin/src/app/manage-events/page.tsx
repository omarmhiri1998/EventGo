
import { EventForm } from "@/ui/organisms/manage-events/EventForm/EventForm";

export default function ManageEventsPage() {
  return (
    <main className="min-h-screen bg-[#FCFAF7] px-5 py-12 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#FF6B53]">
            EventGo Administration
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#08111D]">
            Add New Event
          </h1>

          <p className="mt-3 text-slate-500">
            Create a new event and configure ticket availability.
          </p>
        </div>

        <EventForm />
      </div>
    </main>
  );
}
