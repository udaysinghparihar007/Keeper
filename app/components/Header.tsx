"use client";

import Link from "next/link";
import { useState } from "react";
import HighlightOutlinedIcon from "@mui/icons-material/HighlightOutlined";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AuthButtons from "./AuthButtons";

interface HeaderProps {
  isGuest: boolean;
  hasGuestNotes: boolean;
  plan: "FREE" | "PRO" | null;
  onSearch: (value: string) => void;
  onSavePermanently: () => void;
}

export default function Header({
  isGuest,
  hasGuestNotes,
  plan,
  onSearch,
  onSavePermanently,
}: HeaderProps) {
  const [search, setSearch] = useState("");

  function updateSearch(value: string) {
    setSearch(value);
    onSearch(value);
  }

  return (
    <header className="keeper-header">
      <Link href="/" className="brand-link" aria-label="Keeper home">
        <span className="brand-mark">
          <HighlightOutlinedIcon fontSize="small" />
        </span>
        Keeper
      </Link>
      <div className="header-center">
        <label className="search-field">
          <SearchIcon fontSize="small" />
          <input
            aria-label="Search notes"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search notes"
          />
        </label>
      </div>
      <div className="header-actions">
        <AuthButtons
          isGuest={isGuest}
          hasGuestNotes={hasGuestNotes}
          plan={plan}
          onSavePermanently={onSavePermanently}
        />
        <KeyboardArrowDownIcon className="account-chevron" fontSize="small" />
      </div>
    </header>
  );
}
