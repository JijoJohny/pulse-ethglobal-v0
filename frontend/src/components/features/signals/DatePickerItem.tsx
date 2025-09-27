import React from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';

interface DatePickerItemProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export function DatePickerItem({ selectedDate, setSelectedDate }: DatePickerItemProps) {
  return (
    <div className="relative">
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => date && setSelectedDate(date)}
        dateFormat="MMM dd, yyyy"
        className="chip cursor-pointer"
        popperClassName="z-50"
        showPopperArrow={false}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year from now
      />
    </div>
  );
}
