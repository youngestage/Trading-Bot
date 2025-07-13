export interface MarketStatus {
  isOpen: boolean
  nextOpen?: Date
  nextClose?: Date
  reason?: string
  timeZone: string
}

export interface MarketHoliday {
  date: string // YYYY-MM-DD format
  name: string
  description: string
}

export class MarketHoursService {
  private static readonly FOREX_HOLIDAYS_2024: MarketHoliday[] = [
    { date: '2024-01-01', name: 'New Year\'s Day', description: 'Global market closure' },
    { date: '2024-03-29', name: 'Good Friday', description: 'Major market closure' },
    { date: '2024-04-01', name: 'Easter Monday', description: 'European market closure' },
    { date: '2024-05-01', name: 'Labour Day', description: 'European market closure' },
    { date: '2024-05-27', name: 'Spring Bank Holiday', description: 'UK market closure' },
    { date: '2024-07-04', name: 'Independence Day', description: 'US market closure' },
    { date: '2024-08-26', name: 'Summer Bank Holiday', description: 'UK market closure' },
    { date: '2024-09-02', name: 'Labor Day', description: 'US market closure' },
    { date: '2024-10-14', name: 'Columbus Day', description: 'US market closure' },
    { date: '2024-11-11', name: 'Veterans Day', description: 'US market closure' },
    { date: '2024-11-28', name: 'Thanksgiving', description: 'US market closure' },
    { date: '2024-11-29', name: 'Black Friday', description: 'Reduced trading hours' },
    { date: '2024-12-25', name: 'Christmas Day', description: 'Global market closure' },
    { date: '2024-12-26', name: 'Boxing Day', description: 'UK/EU market closure' },
    { date: '2024-12-31', name: 'New Year\'s Eve', description: 'Early market close' }
  ]

  /**
   * Get current market status for forex trading
   */
  static getMarketStatus(): MarketStatus {
    const now = new Date()
    const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
    
    // Check if it's a holiday
    const holidayCheck = this.checkForHoliday(utcNow)
    if (holidayCheck.isHoliday) {
      return {
        isOpen: false,
        reason: `Market closed for ${holidayCheck.holiday?.name}`,
        timeZone: 'UTC',
        nextOpen: this.getNextMarketOpen(utcNow)
      }
    }

    // Forex market hours: Sunday 21:00 UTC to Friday 21:00 UTC
    const dayOfWeek = utcNow.getUTCDay() // 0 = Sunday, 6 = Saturday
    const hourUTC = utcNow.getUTCHours()
    const minuteUTC = utcNow.getUTCMinutes()
    const timeInMinutes = hourUTC * 60 + minuteUTC

    // Market is closed on Saturday and Sunday before 21:00 UTC
    if (dayOfWeek === 6) { // Saturday
      return {
        isOpen: false,
        reason: 'Weekend - Market closed on Saturdays',
        timeZone: 'UTC',
        nextOpen: this.getNextSundayOpen(utcNow)
      }
    }

    if (dayOfWeek === 0 && timeInMinutes < 21 * 60) { // Sunday before 21:00 UTC
      return {
        isOpen: false,
        reason: 'Weekend - Market opens Sunday 21:00 UTC',
        timeZone: 'UTC',
        nextOpen: this.getNextSundayOpen(utcNow)
      }
    }

    if (dayOfWeek === 5 && timeInMinutes >= 21 * 60) { // Friday after 21:00 UTC
      return {
        isOpen: false,
        reason: 'Weekend - Market closed Friday 21:00 UTC',
        timeZone: 'UTC',
        nextOpen: this.getNextSundayOpen(utcNow)
      }
    }

    // Market is open
    return {
      isOpen: true,
      timeZone: 'UTC',
      nextClose: this.getNextMarketClose(utcNow)
    }
  }

  /**
   * Check if current date is a major forex market holiday
   */
  private static checkForHoliday(date: Date): { isHoliday: boolean; holiday?: MarketHoliday } {
    const dateString = this.formatDateForHoliday(date)
    const holiday = this.FOREX_HOLIDAYS_2024.find(h => h.date === dateString)
    
    return {
      isHoliday: !!holiday,
      holiday
    }
  }

  /**
   * Get the next time the market opens
   */
  private static getNextMarketOpen(currentDate: Date): Date {
    const nextOpen = new Date(currentDate)
    const dayOfWeek = nextOpen.getUTCDay()

    if (dayOfWeek === 6) { // Saturday
      // Next open is Sunday 21:00 UTC
      nextOpen.setUTCDate(nextOpen.getUTCDate() + 1)
      nextOpen.setUTCHours(21, 0, 0, 0)
    } else if (dayOfWeek === 0) { // Sunday
      // Market opens at 21:00 UTC same day
      nextOpen.setUTCHours(21, 0, 0, 0)
    } else if (dayOfWeek === 5) { // Friday
      // Next open is next Sunday 21:00 UTC
      nextOpen.setUTCDate(nextOpen.getUTCDate() + 2)
      nextOpen.setUTCHours(21, 0, 0, 0)
    } else {
      // Weekday - check if it's a holiday, otherwise market should be open
      const holidayCheck = this.checkForHoliday(nextOpen)
      if (holidayCheck.isHoliday) {
        // Move to next day and check again
        nextOpen.setUTCDate(nextOpen.getUTCDate() + 1)
        return this.getNextMarketOpen(nextOpen)
      }
    }

    return nextOpen
  }

  /**
   * Get the next time the market closes
   */
  private static getNextMarketClose(currentDate: Date): Date {
    const nextClose = new Date(currentDate)
    const dayOfWeek = nextClose.getUTCDay()

    if (dayOfWeek === 5) { // Friday
      nextClose.setUTCHours(21, 0, 0, 0)
    } else {
      // Next Friday 21:00 UTC
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7
      if (daysUntilFriday === 0) {
        nextClose.setUTCDate(nextClose.getUTCDate() + 7) // Next Friday
      } else {
        nextClose.setUTCDate(nextClose.getUTCDate() + daysUntilFriday)
      }
      nextClose.setUTCHours(21, 0, 0, 0)
    }

    return nextClose
  }

  /**
   * Get next Sunday 21:00 UTC opening time
   */
  private static getNextSundayOpen(currentDate: Date): Date {
    const nextSunday = new Date(currentDate)
    const dayOfWeek = nextSunday.getUTCDay()
    
    // Calculate days until next Sunday
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek
    nextSunday.setUTCDate(nextSunday.getUTCDate() + daysUntilSunday)
    nextSunday.setUTCHours(21, 0, 0, 0)
    
    return nextSunday
  }

  /**
   * Format date as YYYY-MM-DD for holiday comparison
   */
  private static formatDateForHoliday(date: Date): string {
    return date.getUTCFullYear() + '-' + 
           String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getUTCDate()).padStart(2, '0')
  }

  /**
   * Get market session name based on current time
   */
  static getCurrentSession(): string {
    const now = new Date()
    const utcHour = now.getUTCHours()

    if (utcHour >= 21 || utcHour < 6) {
      return 'Sydney/Tokyo Session'
    } else if (utcHour >= 6 && utcHour < 14) {
      return 'London Session'
    } else if (utcHour >= 14 && utcHour < 21) {
      return 'New York Session'
    } else {
      return 'Market Transition'
    }
  }

  /**
   * Format time remaining until next market event
   */
  static formatTimeRemaining(targetDate: Date): string {
    const now = new Date()
    const diffMs = targetDate.getTime() - now.getTime()
    
    if (diffMs <= 0) {
      return 'Now'
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  /**
   * Check if trading should be allowed based on market hours
   */
  static isTradingAllowed(): boolean {
    const status = this.getMarketStatus()
    return status.isOpen
  }

  /**
   * Get reduced liquidity warning periods
   */
  static getLiquidityWarning(): { hasWarning: boolean; message?: string } {
    const now = new Date()
    const utcHour = now.getUTCHours()
    const dayOfWeek = now.getUTCDay()

    // Friday afternoon low liquidity
    if (dayOfWeek === 5 && utcHour >= 16) {
      return {
        hasWarning: true,
        message: 'Low liquidity - Friday afternoon trading'
      }
    }

    // Sunday evening - market just opened
    if (dayOfWeek === 0 && utcHour >= 21 && utcHour <= 23) {
      return {
        hasWarning: true,
        message: 'Market just opened - potential volatility'
      }
    }

    // Late night/early morning hours (low liquidity)
    if (utcHour >= 0 && utcHour <= 6) {
      return {
        hasWarning: true,
        message: 'Low liquidity period - overnight trading'
      }
    }

    return { hasWarning: false }
  }
} 