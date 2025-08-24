[Uploading arbitrage_calculator.py…]()
#!/usr/bin/env python3
"""
Arbitrage Calculator - A sleek macOS-style GUI application
for calculating arbitrage betting opportunities.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import math


class ArbitrageCalculator:
    def __init__(self, root):
        self.root = root
        self.setup_window()
        self.setup_styles()
        self.create_widgets()
        
    def setup_window(self):
        """Configure the main window with macOS-style appearance"""
        self.root.title("💰 Arbitrage Calculator")
        self.root.geometry("600x700")
        self.root.resizable(True, True)
        
        # macOS-style window configuration
        self.root.configure(bg='#f5f5f7')
        
        # Center the window on screen
        self.root.update_idletasks()
        x = (self.root.winfo_screenwidth() // 2) - (600 // 2)
        y = (self.root.winfo_screenheight() // 2) - (700 // 2)
        self.root.geometry(f"600x700+{x}+{y}")
        
    def setup_styles(self):
        """Configure ttk styles for modern macOS appearance"""
        self.style = ttk.Style()
        
        # Configure modern button style
        self.style.configure(
            "Modern.TButton",
            background="#007AFF",
            foreground="white",
            borderwidth=0,
            focuscolor="none",
            padding=(20, 10)
        )
        
        # Configure entry style
        self.style.configure(
            "Modern.TEntry",
            borderwidth=1,
            relief="solid",
            padding=(10, 8)
        )
        
        # Configure label style
        self.style.configure(
            "Title.TLabel",
            background="#f5f5f7",
            foreground="#1d1d1f",
            font=("SF Pro Display", 24, "bold")
        )
        
        self.style.configure(
            "Subtitle.TLabel",
            background="#f5f5f7",
            foreground="#86868b",
            font=("SF Pro Text", 14)
        )
        
        self.style.configure(
            "Modern.TLabel",
            background="#f5f5f7",
            foreground="#1d1d1f",
            font=("SF Pro Text", 12)
        )
        
    def create_widgets(self):
        """Create and arrange all GUI widgets"""
        # Main container
        main_frame = tk.Frame(self.root, bg="#f5f5f7", padx=40, pady=30)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(
            main_frame,
            text="Arbitrage Calculator",
            style="Title.TLabel"
        )
        title_label.pack(pady=(0, 10))
        
        # Subtitle
        subtitle_label = ttk.Label(
            main_frame,
            text="Calculate optimal stakes for arbitrage betting opportunities",
            style="Subtitle.TLabel"
        )
        subtitle_label.pack(pady=(0, 30))
        
        # Input section
        input_frame = tk.Frame(main_frame, bg="#ffffff", relief="solid", bd=1)
        input_frame.pack(fill=tk.X, pady=(0, 20))
        
        input_inner = tk.Frame(input_frame, bg="#ffffff", padx=20, pady=20)
        input_inner.pack(fill=tk.BOTH, expand=True)
        
        # Percentages input
        ttk.Label(
            input_inner,
            text="Outcome Percentages",
            style="Modern.TLabel",
            background="#ffffff"
        ).pack(anchor=tk.W, pady=(0, 5))
        
        self.percentages_var = tk.StringVar()
        percentages_entry = ttk.Entry(
            input_inner,
            textvariable=self.percentages_var,
            style="Modern.TEntry",
            font=("SF Pro Text", 12),
            width=50
        )
        percentages_entry.pack(fill=tk.X, pady=(0, 15))
        
        ttk.Label(
            input_inner,
            text="Enter percentages separated by commas (e.g., 47, 52, 1)",
            style="Subtitle.TLabel",
            background="#ffffff"
        ).pack(anchor=tk.W, pady=(0, 15))
        
        # Stake input
        ttk.Label(
            input_inner,
            text="Total Stake Amount ($)",
            style="Modern.TLabel",
            background="#ffffff"
        ).pack(anchor=tk.W, pady=(0, 5))
        
        self.stake_var = tk.StringVar()
        stake_entry = ttk.Entry(
            input_inner,
            textvariable=self.stake_var,
            style="Modern.TEntry",
            font=("SF Pro Text", 12),
            width=50
        )
        stake_entry.pack(fill=tk.X, pady=(0, 10))
        
        # Calculate button
        calculate_btn = tk.Button(
            input_inner,
            text="Calculate Arbitrage",
            command=self.calculate_arbitrage,
            bg="#007AFF",
            fg="white",
            font=("SF Pro Text", 14, "bold"),
            border=0,
            padx=30,
            pady=12,
            cursor="hand2"
        )
        calculate_btn.pack(pady=(15, 0))
        
        # Results section
        self.results_frame = tk.Frame(main_frame, bg="#f5f5f7")
        self.results_frame.pack(fill=tk.BOTH, expand=True, pady=(10, 0))
        
        # Bind Enter key to calculate
        self.root.bind('<Return>', lambda e: self.calculate_arbitrage())
        
    def arbitrage_calculator(self, percentages, total_stake):
        """
        Core arbitrage calculation logic
        percentages: list of outcome probabilities (0-100)
        total_stake: total money to distribute
        """
        # Convert percentages to decimal odds
        odds = [100 / p for p in percentages]
        
        # Calculate sum of inverted odds
        inv_odds_sum = sum(1/o for o in odds)
        
        # Calculate stakes per outcome
        stakes = [(total_stake / o) / inv_odds_sum for o in odds]
        
        # Calculate profit for each outcome
        profits = [s * o - total_stake for s, o in zip(stakes, odds)]
        
        # Overall expected profit if arbitrage exists
        arb_exists = inv_odds_sum < 1
        arb_margin = (1 - inv_odds_sum) * 100  # as percentage
        
        return {
            "odds": odds,
            "stakes": stakes,
            "profits": profits,
            "arb_exists": arb_exists,
            "arb_margin": arb_margin
        }
    
    def calculate_arbitrage(self):
        """Handle the calculate button click"""
        try:
            # Clear previous results
            for widget in self.results_frame.winfo_children():
                widget.destroy()
            
            # Parse input
            percentages_str = self.percentages_var.get().strip()
            stake_str = self.stake_var.get().strip()
            
            if not percentages_str or not stake_str:
                messagebox.showerror("Input Error", "Please fill in all fields.")
                return
            
            percentages = [float(x.strip()) for x in percentages_str.split(",")]
            total_stake = float(stake_str)
            
            # Validate input
            if any(p <= 0 for p in percentages):
                messagebox.showerror("Input Error", "All percentages must be positive.")
                return
            
            if total_stake <= 0:
                messagebox.showerror("Input Error", "Total stake must be positive.")
                return
            
            # Calculate arbitrage
            result = self.arbitrage_calculator(percentages, total_stake)
            
            # Display results
            self.display_results(percentages, result)
            
        except ValueError:
            messagebox.showerror("Input Error", "Please enter valid numbers only.")
        except Exception as e:
            messagebox.showerror("Calculation Error", f"An error occurred: {str(e)}")
    
    def display_results(self, percentages, result):
        """Display the calculation results in a beautiful format"""
        # Results container
        results_container = tk.Frame(self.results_frame, bg="#ffffff", relief="solid", bd=1)
        results_container.pack(fill=tk.BOTH, expand=True)
        
        results_inner = tk.Frame(results_container, bg="#ffffff", padx=20, pady=20)
        results_inner.pack(fill=tk.BOTH, expand=True)
        
        # Results title
        ttk.Label(
            results_inner,
            text="Results",
            font=("SF Pro Display", 18, "bold"),
            background="#ffffff",
            foreground="#1d1d1f"
        ).pack(anchor=tk.W, pady=(0, 15))
        
        # Arbitrage status
        if result["arb_exists"]:
            status_color = "#34C759"  # Green
            status_text = f"✅ Arbitrage Opportunity Found!"
            margin_text = f"Arbitrage Margin: {result['arb_margin']:.2f}%"
        else:
            status_color = "#FF3B30"  # Red
            status_text = "❌ No Arbitrage Opportunity"
            margin_text = f"Loss Margin: {abs(result['arb_margin']):.2f}%"
        
        status_label = tk.Label(
            results_inner,
            text=status_text,
            font=("SF Pro Text", 14, "bold"),
            bg="#ffffff",
            fg=status_color
        )
        status_label.pack(anchor=tk.W, pady=(0, 5))
        
        margin_label = tk.Label(
            results_inner,
            text=margin_text,
            font=("SF Pro Text", 12),
            bg="#ffffff",
            fg="#86868b"
        )
        margin_label.pack(anchor=tk.W, pady=(0, 20))
        
        # Results table
        table_frame = tk.Frame(results_inner, bg="#f8f9fa", relief="solid", bd=1)
        table_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Table header
        header_frame = tk.Frame(table_frame, bg="#e9ecef")
        header_frame.pack(fill=tk.X)
        
        headers = ["Outcome", "Percentage", "Stake", "Potential Profit"]
        for i, header in enumerate(headers):
            tk.Label(
                header_frame,
                text=header,
                font=("SF Pro Text", 11, "bold"),
                bg="#e9ecef",
                fg="#495057",
                padx=15,
                pady=10
            ).grid(row=0, column=i, sticky="ew")
        
        header_frame.columnconfigure(0, weight=1)
        header_frame.columnconfigure(1, weight=1)
        header_frame.columnconfigure(2, weight=1)
        header_frame.columnconfigure(3, weight=1)
        
        # Table rows
        for i, (percentage, stake, profit) in enumerate(zip(percentages, result["stakes"], result["profits"])):
            row_bg = "#ffffff" if i % 2 == 0 else "#f8f9fa"
            profit_color = "#34C759" if profit >= 0 else "#FF3B30"
            
            row_frame = tk.Frame(table_frame, bg=row_bg)
            row_frame.pack(fill=tk.X)
            
            # Outcome number
            tk.Label(
                row_frame,
                text=f"Outcome {i+1}",
                font=("SF Pro Text", 11),
                bg=row_bg,
                fg="#1d1d1f",
                padx=15,
                pady=8
            ).grid(row=0, column=0, sticky="ew")
            
            # Percentage
            tk.Label(
                row_frame,
                text=f"{percentage:.2f}%",
                font=("SF Pro Text", 11),
                bg=row_bg,
                fg="#1d1d1f",
                padx=15,
                pady=8
            ).grid(row=0, column=1, sticky="ew")
            
            # Stake
            tk.Label(
                row_frame,
                text=f"${stake:.2f}",
                font=("SF Pro Text", 11),
                bg=row_bg,
                fg="#1d1d1f",
                padx=15,
                pady=8
            ).grid(row=0, column=2, sticky="ew")
            
            # Profit
            profit_sign = "+" if profit >= 0 else ""
            tk.Label(
                row_frame,
                text=f"{profit_sign}${profit:.2f}",
                font=("SF Pro Text", 11, "bold"),
                bg=row_bg,
                fg=profit_color,
                padx=15,
                pady=8
            ).grid(row=0, column=3, sticky="ew")
            
            row_frame.columnconfigure(0, weight=1)
            row_frame.columnconfigure(1, weight=1)
            row_frame.columnconfigure(2, weight=1)
            row_frame.columnconfigure(3, weight=1)
        
        # Summary
        total_stake_label = tk.Label(
            results_inner,
            text=f"Total Stake: ${sum(result['stakes']):.2f}",
            font=("SF Pro Text", 12),
            bg="#ffffff",
            fg="#86868b"
        )
        total_stake_label.pack(anchor=tk.W, pady=(15, 5))


def main():
    """Main function to run the application"""
    root = tk.Tk()
    app = ArbitrageCalculator(root)
    root.mainloop()


if __name__ == "__main__":
    main()
