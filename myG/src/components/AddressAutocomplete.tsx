import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddressSuggestion } from "@/lib/location";
import {
  searchAddressSuggestions,
  geocodeTypedAddress,
  resolveGooglePlace,
  needsPlaceResolution,
  isGooglePlacesConfigured,
} from "@/lib/address-search";
import { MapPin, Loader2, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectedDestination {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (destination: SelectedDestination) => void;
  selectedDestination: SelectedDestination | null;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  selectedDestination,
  disabled = false,
  label = "Destination address",
  placeholder = "Town, farm, street — anywhere in South Africa",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const searchBiasRef = useRef<{ lat: number; lon: number } | undefined>(undefined);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        searchBiasRef.current = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, []);

  const updateDropdownPosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  const applySuggestion = async (suggestion: AddressSuggestion) => {
    setIsResolving(true);
    try {
      let latitude = suggestion.latitude;
      let longitude = suggestion.longitude;
      let address = suggestion.address;

      if (needsPlaceResolution(suggestion)) {
        const googleId = suggestion.placeId.replace(/^google_/, "");
        const resolved = await resolveGooglePlace(googleId);
        if (!resolved) {
          throw new Error("Could not resolve that place. Pick another result or use the button below.");
        }
        latitude = resolved.latitude;
        longitude = resolved.longitude;
        address = resolved.address || suggestion.address;
      }

      const name = address.split(",")[0]?.trim() || address;
      onChange(address);
      onSelect({
        placeId: suggestion.placeId,
        name,
        address,
        latitude,
        longitude,
      });
      setSuggestions([]);
      setSearchError(null);
      setIsOpen(false);
    } finally {
      setIsResolving(false);
    }
  };

  const handleUseTypedAddress = async () => {
    const trimmed = value.trim();
    if (trimmed.length < 4) {
      setSearchError("Enter at least 4 characters (e.g. village, farm, or street).");
      setIsOpen(true);
      return;
    }

    setIsResolving(true);
    setSearchError(null);
    try {
      const result = await geocodeTypedAddress(trimmed, searchBiasRef.current);
      await applySuggestion(result);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Could not find that address."
      );
      setIsOpen(true);
    } finally {
      setIsResolving(false);
    }
  };

  useEffect(() => {
    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setSearchError(null);
      setIsOpen(false);
      return;
    }

    if (
      selectedDestination &&
      value.trim() === selectedDestination.address
    ) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setSearchError(null);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(
          value,
          20,
          searchBiasRef.current
        );
        if (requestId !== requestIdRef.current) return;

        setSuggestions(results);
        setSearchError(
          results.length === 0
            ? "No matches in the list — use the button below to find your exact address."
            : null
        );
        setIsOpen(true);
        updateDropdownPosition();
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setSuggestions([]);
        setSearchError(
          err instanceof Error
            ? err.message
            : "Search failed. Use the button below to locate your address."
        );
        setIsOpen(true);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, selectedDestination]);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    const onScrollOrResize = () => updateDropdownPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen, suggestions.length, searchError]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        (target instanceof Element && target.closest("[data-address-suggestions]"))
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const busy = isLoading || isResolving;
  const canUseTyped = value.trim().length >= 4 && !busy;

  const showDropdown =
    isOpen &&
    !disabled &&
    (isLoading || suggestions.length > 0 || !!searchError || canUseTyped);

  const dropdown =
    showDropdown && dropdownStyle ? (
      <ul
        data-address-suggestions
        className="fixed z-[9999] max-h-72 overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
        style={{
          top: dropdownStyle.top,
          left: dropdownStyle.left,
          width: dropdownStyle.width,
        }}
        role="listbox"
      >
        {isLoading && suggestions.length === 0 && (
          <li className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Searching towns, farms, streets across South Africa…
          </li>
        )}

        {suggestions.map((s) => (
          <li key={s.placeId}>
            <button
              type="button"
              role="option"
              disabled={busy}
              className={cn(
                "flex w-full gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors border-b border-border/50",
                selectedDestination?.placeId === s.placeId && "bg-muted/80"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applySuggestion(s)}
            >
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>{s.displayName}</span>
            </button>
          </li>
        ))}

        {!isLoading && searchError && suggestions.length === 0 && (
          <li className="flex items-start gap-2 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200 bg-amber-50/80 dark:bg-amber-950/40 border-b border-border/50">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{searchError}</span>
          </li>
        )}

        {canUseTyped && (
          <li className="p-2 border-t border-border bg-muted/30">
            <button
              type="button"
              disabled={busy}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-primary hover:bg-muted transition-colors disabled:opacity-50"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleUseTypedAddress}
            >
              {isResolving ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Search className="h-4 w-4 shrink-0" />
              )}
              Find &ldquo;{value.trim()}&rdquo; on the map
            </button>
          </li>
        )}
      </ul>
    ) : null;

  return (
    <div ref={containerRef} className="space-y-2">
      <Label htmlFor="destination-address">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          id="destination-address"
          value={value}
          disabled={disabled || isResolving}
          placeholder={placeholder}
          className="pl-9 pr-9"
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            updateDropdownPosition();
          }}
          onFocus={() => {
            updateDropdownPosition();
            if (value.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canUseTyped) {
              e.preventDefault();
              handleUseTypedAddress();
            }
          }}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {busy && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground pointer-events-none" />
        )}
      </div>

      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}

      <p className="text-xs text-muted-foreground">
        {selectedDestination
          ? "Destination set. You can start tracking when ready."
          : isGooglePlacesConfigured()
            ? "Pick a suggestion, or press Enter / tap “Find on the map” for rural addresses."
            : "Pick a suggestion or tap “Find on the map”. For best rural coverage, add VITE_GOOGLE_PLACES_API_KEY to .env (see .env.example)."}
      </p>
    </div>
  );
}
