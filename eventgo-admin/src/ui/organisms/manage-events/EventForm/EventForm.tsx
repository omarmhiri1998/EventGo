
"use client";

import { useRef, useState } from "react";
import {
  CalendarDays,
  Plus,
  Trash2,
  Ticket,
} from "lucide-react";

import { createEventAction } from "@/app/actions/manage-events.actions";

const categories = [
  "music",
  "sports",
  "technology",
  "food",
  "art",
  "business",
  "nightlife",
  "festivals",
  "cinema",
  "comedy",
  "culture",
  "wellness",
];

interface TicketType {
  id: number;
  name: string;
  price: string;
  quantity: string;
}

const labelClass =
  "mb-2 block text-sm font-semibold text-[#08111D]";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white p-3 " +
  "text-[#08111D] placeholder:text-slate-400 " +
  "outline-none focus:border-[#FF6B53]";

const initialTickets: TicketType[] = [
  {
    id: 0,
    name: "General Admission",
    price: "",
    quantity: "",
  },
];

export function EventForm() {
  const nextTicketId = useRef(1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("music");
  const [city, setCity] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("");

  const [tickets, setTickets] = useState<TicketType[]>(
    initialTickets
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function updateTicket(
    id: number,
    key: "name" | "price" | "quantity",
    value: string
  ) {
    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === id
          ? { ...ticket, [key]: value }
          : ticket
      )
    );
  }

  function addTicket() {
    const id = nextTicketId.current++;

    setTickets((previous) => [
      ...previous,
      {
        id,
        name: "",
        price: "",
        quantity: "",
      },
    ]);
  }

  function removeTicket(id: number) {
    setTickets((previous) =>
      previous.filter((ticket) => ticket.id !== id)
    );
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("music");
    setCity("");
    setStartsAt("");
    setEndsAt("");
    setCapacity("");
    setTickets(initialTickets.map((ticket) => ({ ...ticket })));
    nextTicketId.current = 1;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) return;

    setSuccessMessage("");
    setErrorMessage("");

    try {
      if (!title.trim()) {
        throw new Error("Event title is required.");
      }

      if (!city.trim()) {
        throw new Error("City is required.");
      }

      if (!startsAt) {
        throw new Error("Start date is required.");
      }

      if (capacity.trim() === "") {
        throw new Error("Event capacity is required.");
      }

      const parsedCapacity = Number(capacity);

      if (
        !Number.isSafeInteger(parsedCapacity) ||
        parsedCapacity < 0
      ) {
        throw new Error("Invalid event capacity.");
      }

      const startDate = new Date(startsAt);

      if (Number.isNaN(startDate.getTime())) {
        throw new Error("Invalid start date.");
      }

      const endDate = endsAt ? new Date(endsAt) : null;

      if (
        endDate &&
        (Number.isNaN(endDate.getTime()) ||
          endDate <= startDate)
      ) {
        throw new Error(
          "End date must be after start date."
        );
      }

      if (tickets.length === 0) {
        throw new Error(
          "Add at least one ticket type."
        );
      }

      const parsedTickets = tickets.map((ticket) => {
        if (
          !ticket.name.trim() ||
          ticket.price.trim() === "" ||
          ticket.quantity.trim() === ""
        ) {
          throw new Error(
            "Please complete all ticket fields."
          );
        }

        const price = Number(ticket.price);
        const quantity = Number(ticket.quantity);

        if (
          !Number.isFinite(price) ||
          price < 0 ||
          Math.round(price * 100) / 100 !== price
        ) {
          throw new Error(
            "Ticket price must be a valid amount with at most two decimals."
          );
        }

        if (
          !Number.isSafeInteger(quantity) ||
          quantity < 0
        ) {
          throw new Error(
            "Ticket quantity must be a non-negative integer."
          );
        }

        return {
          name: ticket.name.trim(),
          price,
          quantity,
        };
      });

      const totalQuantity = parsedTickets.reduce(
        (sum, ticket) => sum + ticket.quantity,
        0
      );

      if (totalQuantity > parsedCapacity) {
        throw new Error(
          "Total ticket quantity cannot exceed event capacity."
        );
      }

      setIsSubmitting(true);

      const result = await createEventAction({
        title: title.trim(),
        description: description.trim(),
        category,
        city: city.trim(),
        startsAt: startDate.toISOString(),
        endsAt: endDate ? endDate.toISOString() : null,
        capacity: parsedCapacity,
        tickets: parsedTickets,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      resetForm();
      setSuccessMessage("Event created successfully!");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 text-[#08111D]"
    >
      {/* EVENT INFORMATION */}
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-bold text-[#08111D]">
          Event Information
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* TITLE */}
          <div className="md:col-span-2">
            <label htmlFor="event-title" className={labelClass}>
              Event Title
            </label>

            <input
              id="event-title"
              type="text"
              required
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Enter event title"
              className={inputClass}
            />
          </div>

          {/* DESCRIPTION */}
          <div className="md:col-span-2">
            <label
              htmlFor="event-description"
              className={labelClass}
            >
              Description
            </label>

            <textarea
              id="event-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={4}
              placeholder="Describe your event..."
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label
              htmlFor="event-category"
              className={labelClass}
            >
              Category
            </label>

            <select
              id="event-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className={inputClass}
            >
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                  className="bg-white text-[#08111D]"
                >
                  {item.charAt(0).toUpperCase() +
                    item.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* CITY */}
          <div>
            <label htmlFor="event-city" className={labelClass}>
              City
            </label>

            <input
              id="event-city"
              type="text"
              required
              value={city}
              onChange={(event) =>
                setCity(event.target.value)
              }
              placeholder="e.g. Dortmund"
              className={inputClass}
            />
          </div>

          {/* START DATE */}
          <div>
            <label htmlFor="event-start" className={labelClass}>
              Start Date & Time
            </label>

            <input
              id="event-start"
              type="datetime-local"
              required
              value={startsAt}
              onChange={(event) =>
                setStartsAt(event.target.value)
              }
              className={inputClass}
            />
          </div>

          {/* END DATE */}
          <div>
            <label htmlFor="event-end" className={labelClass}>
              End Date & Time
            </label>

            <input
              id="event-end"
              type="datetime-local"
              value={endsAt}
              min={startsAt || undefined}
              onChange={(event) =>
                setEndsAt(event.target.value)
              }
              className={inputClass}
            />
          </div>

          {/* CAPACITY */}
          <div>
            <label
              htmlFor="event-capacity"
              className={labelClass}
            >
              Event Capacity
            </label>

            <input
              id="event-capacity"
              type="number"
              min="0"
              step="1"
              required
              value={capacity}
              onChange={(event) =>
                setCapacity(event.target.value)
              }
              placeholder="e.g. 200"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* TICKET TYPES */}
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#08111D]">
              <Ticket size={21} className="text-[#FF6B53]" />
              Ticket Types
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Configure the tickets available for this event.
            </p>
          </div>

          <button
            type="button"
            onClick={addTicket}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#08111D] hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus size={17} />
            Add Ticket Type
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {tickets.map((ticket, index) => (
            <div
              key={ticket.id}
              className="grid gap-4 rounded-2xl bg-[#FCFAF7] p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
            >
              {/* TICKET NAME */}
              <div>
                <label
                  htmlFor={`ticket-name-${ticket.id}`}
                  className={labelClass}
                >
                  Ticket Name
                </label>

                <input
                  id={`ticket-name-${ticket.id}`}
                  type="text"
                  required
                  value={ticket.name}
                  onChange={(event) =>
                    updateTicket(
                      ticket.id,
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="e.g. VIP"
                  className={inputClass}
                />
              </div>

              {/* PRICE */}
              <div>
                <label
                  htmlFor={`ticket-price-${ticket.id}`}
                  className={labelClass}
                >
                  Price (€)
                </label>

                <input
                  id={`ticket-price-${ticket.id}`}
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={ticket.price}
                  onChange={(event) =>
                    updateTicket(
                      ticket.id,
                      "price",
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>

              {/* QUANTITY */}
              <div>
                <label
                  htmlFor={`ticket-quantity-${ticket.id}`}
                  className={labelClass}
                >
                  Quantity
                </label>

                <input
                  id={`ticket-quantity-${ticket.id}`}
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={ticket.quantity}
                  onChange={(event) =>
                    updateTicket(
                      ticket.id,
                      "quantity",
                      event.target.value
                    )
                  }
                  placeholder="100"
                  className={inputClass}
                />
              </div>

              {/* REMOVE */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeTicket(ticket.id)}
                  disabled={isSubmitting}
                  aria-label={`Remove ticket type ${index + 1}`}
                  className="rounded-xl p-3 text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={19} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {tickets.length === 0 && (
          <p className="mt-6 text-sm text-slate-500">
            No ticket types added yet.
          </p>
        )}
      </section>

      {/* STATUS AND CREATE BUTTON */}
      <div className="flex flex-col items-end gap-4">
        {errorMessage && (
          <p
            role="alert"
            className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p
            role="status"
            className="w-full rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-[#FF6B53] px-8 py-3 font-bold text-white transition-colors hover:bg-[#f45e47] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarDays size={19} />
          {isSubmitting ? "Creating..." : "Create Event"}
        </button>
      </div>
    </form>
  );
}
