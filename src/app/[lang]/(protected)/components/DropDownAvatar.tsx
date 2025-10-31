import { Dropdown } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";
import { Button as AriaButton } from "react-aria-components";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Badge,
  HelpCircle,
  Layers,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Button } from "@/components/ui/button";
import Signout from "./Signout";

interface DropdownAvatarProps {
  src: string;
  name: string;
  email: string;
  unreadNotifications: number;
}

export const DropdownAvatar = ({
  src,
  name,
  email,
  unreadNotifications,
}: DropdownAvatarProps) => (
  <Dropdown.Root>
    <AriaButton
      className={({ isPressed, isFocusVisible }) =>
        cx(
          "group relative inline-flex cursor-pointer rounded-full outline-focus-ring",
          (isPressed || isFocusVisible) && "outline-2 outline-offset-2",
        )
      }
    >
      <Avatar>
        <AvatarImage src={src} />
        <AvatarFallback>
          {name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </AriaButton>

    <Dropdown.Popover>
      <div className="flex gap-3 border-b border-secondary p-3 bg-white">
        <AvatarLabelGroup
          size="md"
          src={src}
          status="online"
          title={name}
          subtitle={email}
        />
      </div>
      <Dropdown.Menu>
        <Dropdown.Section className="bg-white">
          <Dropdown.Item addon="" icon={User}>
            <a
              href={`/en/profile`}
              className="text-sm font-semibold text-black hover:text-blue-500"
            >
              <p>View profile</p>
            </a>
          </Dropdown.Item>
          <Dropdown.Item addon="" icon={Settings}>
            <a
              href={`/en/profile#settings`}
              className="text-sm font-semibold text-black hover:text-blue-500"
            >
              <p>Settings</p>
            </a>
          </Dropdown.Item>
        </Dropdown.Section>
        <Dropdown.Section className="bg-white">
          <Dropdown.Item icon={Layers}>
            <a
              href={`/en/notifications`}
              className="text-sm font-semibold text-black hover:text-blue-500"
            >
              Notifications
              <p>
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-blue-600 text-white text-[10px] leading-none flex items-center justify-center">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </Badge>
                )}
              </p>
            </a>
          </Dropdown.Item>
          <Dropdown.Item icon={HelpCircle}>
            <a
              href={`/en/about`}
              className="text-sm font-semibold text-black hover:text-blue-500"
            >
              <p>About</p>
            </a>
          </Dropdown.Item>
        </Dropdown.Section>
        <Dropdown.Section className="bg-white">
          <Dropdown.Item addon="" icon={LogOut}>
            <Button
              onClick={Signout}
              className="text-sm font-semibold text-red-600 hover:text-black"
            >
              Log out
            </Button>
          </Dropdown.Item>
        </Dropdown.Section>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown.Root>
);
