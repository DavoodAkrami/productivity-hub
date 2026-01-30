"use client"
import React, { useState } from "react";
import clsx from "clsx";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

interface CalendarProps {
    selectedDate: string | null;
    onDateSelect: (date: string | null) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [currentMonth, setCurrentMonth] = useState(() => {
        if (selectedDate) {
            const date = new Date(selectedDate);
            return new Date(date.getFullYear(), date.getMonth(), 1);
        }
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const weekdays = ["S", "S", "M", "T", "W", "Th", "F"];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const dayMapping: { [key: number]: number } = {
            0: 0,
            6: 1,
            1: 2,
            2: 3,
            3: 4,
            4: 5,
            5: 6
        };

        const days: (number | null)[] = [];
        
        const startIndex = dayMapping[startingDayOfWeek] ?? 0;
        for (let i = 0; i < startIndex; i++) {
            days.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const days = getDaysInMonth(currentMonth);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const dateStr = getDateString(year, month, day);
        
        if (selectedDate) {
            const selectedStr = getDateStringFromISO(selectedDate);
            if (dateStr === selectedStr) {
                onDateSelect(null);
                return;
            }
        }
        
        const selected = new Date(dateStr + 'T00:00:00.000Z');
        onDateSelect(selected.toISOString());
    };

    const getDateString = (year: number, month: number, day: number): string => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const getDateStringFromISO = (isoString: string): string => {
        const date = new Date(isoString);
        return getDateString(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    };

    const isToday = (day: number | null): boolean => {
        if (day === null) return false;
        const dateStr = getDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const todayStr = getDateString(today.getFullYear(), today.getMonth(), today.getDate());
        return dateStr === todayStr;
    };

    const isSelected = (day: number | null): boolean => {
        if (day === null || !selectedDate) return false;
        const dateStr = getDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const selectedStr = getDateStringFromISO(selectedDate);
        return dateStr === selectedStr;
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const year = parseInt(e.target.value);
        setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const month = parseInt(e.target.value);
        setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
    };

    const currentYear = today.getFullYear();
    const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

    return (
        <div className="w-full">
            <div className="flex gap-2 mb-4">
                <select
                    value={currentMonth.getFullYear()}
                    onChange={handleYearChange}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border-2 border-[var(--fill-primary)] outline-none cursor-pointer"
                >
                    {years.map(year => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
                <select
                    value={currentMonth.getMonth()}
                    onChange={handleMonthChange}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border-2 border-[var(--fill-primary)] outline-none cursor-pointer"
                >
                    {months.map((month, index) => (
                        <option key={index} value={index}>
                            {month}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex items-center justify-between mb-2">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-full hover:bg-[var(--fill-primary)] transition-colors"
                >
                    <IoIosArrowBack />
                </button>
                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-full hover:bg-[var(--fill-primary)] transition-colors"
                >
                    <IoIosArrowForward />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map((day, index) => (
                    <div
                        key={index}
                        className="text-center text-sm font-semibold text-[var(--text-secondary)] py-1"
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => day !== null && handleDateClick(day)}
                        disabled={day === null}
                        className={clsx(
                            "aspect-square rounded-xl text-sm transition-colors",
                            day === null && "cursor-default",
                            day !== null && "cursor-pointer hover:bg-[var(--fill-primary)]",
                            isToday(day) && "bg-[var(--accent-blue)] text-[var(--text-selected)] font-semibold",
                            isSelected(day) && !isToday(day) && "bg-[var(--fill-primary)] border-2 border-[var(--accent-blue)]",
                            !isToday(day) && !isSelected(day) && day !== null && "hover:bg-[var(--fill-primary)]"
                        )}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Calendar;

