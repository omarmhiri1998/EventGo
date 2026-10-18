import { Heart } from "lucide-react";

import IconButton from "@/ui/atoms/IconButton/IconButton";

import {
  Avatar,
  AvatarFallback,
} from "@/ui/atoms/Avatar/avatar";

export default function UserActions() {
  return (
    <div className="flex items-center gap-5">
      <IconButton label="Favorites">
        <Heart className="h-6 w-6" />
      </IconButton>

      <Avatar className="h-12 w-12 cursor-pointer">
        <AvatarFallback
          className="
            bg-teal-700
            text-sm
            font-semibold
            text-white
          "
        >
          OM
        </AvatarFallback>
      </Avatar>
    </div>
  );
}