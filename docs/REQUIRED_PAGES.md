# Required Pages for Full User Interaction

Based on the USER_FLOW_DIAGRAM.md analysis, here's a comprehensive breakdown of all required pages and their functionalities.

---

## 🎯 Page Categories

1. **Public Pages** (No wallet required)
2. **Investor Pages** (Wallet required)
3. **Founder Pages** (Wallet required)
4. **Shared Pages** (Both user types)

---

## 📄 Detailed Page Requirements

### 1. PUBLIC PAGES

#### 1.1 Landing/Home Page
**Route:** `/`

**Purpose:** Platform introduction and entry point

**Components:**
- Hero section with platform value proposition
- Feature highlights
- How it works section (3-step process)
- Statistics (total raised, active campaigns, success rate)
- Call-to-action buttons:
  - "Browse Projects" → Browse page
  - "Create Campaign" → Create Campaign page (requires wallet)
- Footer with links

**No Authentication Required**

---

#### 1.2 Browse Projects Page
**Route:** `/browse` or `/projects`

**Purpose:** Discover and explore all campaigns

**Components:**
- Search bar (filter by campaign title)
- Filter options:
  - Status: All / Active / Funding / In Progress / Completed / Failed
  - Funding progress: 0-25% / 25-50% / 50-75% / 75-100% / Fully Funded
  - Category (if implemented)
  - Sort by: Newest / Most Funded / Ending Soon
  
- Campaign cards grid showing:
  - Campaign title
  - Short description (truncated)
  - Founder address (truncated)
  - Funding progress bar
  - Current raised / Goal (in ETH)
  - Funding percentage
  - Current milestone status
  - Number of funders
  - Campaign state badge
  - "View Details" button

**User Actions:**
- Browse without wallet
- Click card to view details (→ Campaign Details page)
- Connect wallet to fund projects

---

### 2. INVESTOR PAGES

#### 2.1 Campaign Details Page (Investor View)
**Route:** `/campaign/[campaignId]`

**Purpose:** View complete campaign information and take action

**Components:**

**Campaign Header:**
- Campaign title
- Founder address with ENS support
- Campaign creation date
- Campaign state badge (Active/Voting/Completed/Failed/Paused)

**Funding Section:**
- Large progress bar
- Current raised / Goal (in ETH and USD)
- Funding percentage
- Number of funders
- Time remaining (if applicable)

**Milestones Section (5 milestones):**
For each milestone display:
- Milestone number and description
- Deadline date (countdown if active)
- Release percentage
- Status badge:
  - Pending (grey)
  - Submitted - Voting (blue)
  - Approved (green)
  - Rejected (red)
  - Completed (dark green)
- IPFS link (if submitted)
- Voting stats (if in voting):
  - YES votes (ETH and %)
  - NO votes (ETH and %)
  - Time remaining

**Project Description:**
- Full campaign description (markdown support)
- Images/media if provided

**Funding Action Panel (Sticky Sidebar):**
If wallet NOT connected:
- "Connect Wallet to Fund" button

If wallet connected but NOT funded:
- "Fund This Campaign" section:
  - Risk profile selector:
    - Conservative (50/50) - Recommended badge
    - Balanced (70/30)
    - Aggressive (90/10)
  - Amount input (ETH)
    - Min: 0.001 ETH
    - Max: User wallet balance
  - Split preview:
    - Committed: X ETH
    - Reserve: Y ETH
  - "Fund Campaign" button
  - Risk profile explanation tooltip

If wallet connected AND already funded:
- "Your Investment" card:
  - Total contributed: X ETH
  - Risk profile: Conservative/Balanced/Aggressive
  - Committed: X ETH (remaining: Y ETH)
  - Reserve: Z ETH
  - Your voting power: X%
  - Number of milestones you voted on: X/Y
  - Consecutive missed votes: X
  - Auto-YES mode status

**Active Milestone Voting (If applicable):**
- "Vote on Milestone X" section:
  - Milestone description
  - IPFS evidence link (opens in new tab)
  - Voting deadline countdown
  - Current voting stats
  - Vote buttons:
    - "Vote YES ✅" (green)
    - "Vote NO ❌" (red)
  - "Your vote" status if already voted

**Campaign Activity Timeline:**
- Chronological list of events:
  - Campaign created
  - Funding milestones (25%, 50%, 75%, 100%)
  - Milestone submissions
  - Voting results
  - Fund releases
  - Campaign state changes

**Funder List:**
- Table showing:
  - Funder address (truncated)
  - Amount contributed
  - Risk profile
  - Date funded
  - Voting participation rate

---

#### 2.2 My Investments Dashboard
**Route:** `/investor/dashboard` or `/my-investments`

**Purpose:** Manage all investments and pending actions

**Components:**

**Portfolio Overview Cards:**
- Total Invested (ETH + USD)
- Active Investments (count)
- Completed Investments (count)
- Available Refunds (ETH)
- Total Voting Power (across all campaigns)

**Pending Actions Section (Priority):**
- "⚠️ Action Required" badges
- List of campaigns requiring votes:
  - Campaign name
  - Milestone number
  - Voting deadline
  - "Vote Now" button → Campaign Details page

**Active Investments Tabs:**
- All Investments
- Active Campaigns
- Voting Phase
- Completed
- Failed

**Investment Cards:**
Each card shows:
- Campaign title
- Your investment: X ETH
- Risk profile badge
- Current milestone
- Status indicator:
  - 🟢 On Track
  - 🔵 Voting Active
  - 🟡 Waiting for Submission
  - 🔴 Failed
  - ✅ Completed
- Progress: "Milestone X/5 completed"
- Quick actions:
  - "View Campaign" button
  - "Vote" button (if voting active)
  - "Claim Refund" button (if failed)

**Voting History:**
- Your voting record across all campaigns
- Participation rate
- Auto-YES campaigns list

**Refunds Available:**
- List of failed campaigns with refundable amounts
- "Claim All Refunds" button
- Individual "Claim" buttons

**Notifications Panel:**
- Recent activity on your investments
- Voting reminders
- Milestone approvals/rejections
- Refund availability

---

#### 2.3 Voting Page
**Route:** `/campaign/[campaignId]/vote/[milestoneIndex]`

**Purpose:** Detailed milestone review and voting

**Components:**

**Milestone Information:**
- Milestone number and description
- Original deadline
- Submission date
- Days used vs available

**Evidence Section:**
- IPFS link (prominently displayed)
- Preview/embed of IPFS content (if possible)
- Download evidence button
- Evidence description from founder

**Voting Stats (Live):**
- Progress bars:
  - YES votes (green): X ETH (Y%)
  - NO votes (red): A ETH (B%)
- Total participation: X/Y funders
- Your voting power: Z ETH
- Voting deadline countdown

**Your Vote Section:**
- Large action buttons:
  - "✅ Approve Milestone" (green)
  - "❌ Reject Milestone" (red)
- Vote confirmation modal:
  - "Are you sure you want to vote [YES/NO]?"
  - "Your vote carries X ETH of voting power"
  - "This action cannot be undone"
  - Confirm / Cancel

**Campaign Context:**
- Link back to campaign details
- Previous milestones status
- Project description (collapsed)

**Discussion/Comments (Optional):**
- Community comments on milestone
- Concerns raised
- Founder responses

---

#### 2.4 Refund Claim Page
**Route:** `/campaign/[campaignId]/refund`

**Purpose:** Claim refund from failed campaign

**Components:**

**Campaign Failed Notice:**
- Failure reason:
  - "Milestone X rejected 2 times"
  - "Deadline exceeded for Milestone X"
- Failure date

**Refund Breakdown:**
- Your original contribution: X ETH
- Funds released to founder: -Y ETH (list milestones)
- Unreleased committed funds: Z ETH
- Full reserve funds: A ETH
- Subtotal: B ETH
- Platform fee (2%): -C ETH
- **Your Refund: D ETH** (highlighted)

**Visual Breakdown:**
- Pie chart or bar showing:
  - Funds lost (released milestones)
  - Platform fee
  - Refund amount

**Refund Action:**
- "Claim Refund" button (large, primary)
- Transaction confirmation
- Success message with transaction hash
- "Refund claimed! X ETH sent to your wallet"

**Post-Claim:**
- Transaction successful message
- Link to block explorer
- "View Other Investments" button

---

### 3. FOUNDER PAGES

#### 3.1 Create Campaign Page
**Route:** `/create-campaign` or `/founder/create`

**Purpose:** Create a new crowdfunding campaign

**Components:**

**Multi-Step Form:**

**Step 1: Basic Information**
- Campaign title input
  - Min: 3 chars, Max: 100 chars
  - Character counter
- Campaign description textarea
  - Min: 1 char, Max: 1000 chars
  - Markdown support
  - Preview toggle
  - Character counter
- Funding goal input
  - Min: 0.01 ETH, Max: 10,000 ETH
  - ETH to USD conversion preview
- Validation messages

**Step 2: Define Milestones (5 required)**

For each milestone (M0 to M4):
- Milestone description input (Max 200 chars)
- Deadline input (date picker)
  - Min: 7 days from now
  - Max: 365 days from now
  - Must be chronological (M1 > M0, M2 > M1, etc.)
- Release percentage input
  - Min: 5%, Max: 50% per milestone
  - Real-time total percentage calculator
  - Must sum to exactly 100%
  - Visual percentage bar

**Milestone Setup Helper:**
- Preset templates:
  - "Standard 5-Phase" (10%, 20%, 25%, 25%, 20%)
  - "Conservative Start" (5%, 15%, 20%, 30%, 30%)
  - "Aggressive Start" (25%, 25%, 20%, 15%, 15%)
- Auto-calculate remaining percentage

**Step 3: Review & Confirm**
- Summary of all inputs:
  - Campaign info
  - Funding goal
  - Milestone timeline (visual roadmap)
  - Release schedule
- Creation fee display
  - "Creation Fee: 0.001 ETH" (or dynamic)
- Terms & conditions checkbox
- "Create Campaign" button

**Post-Creation:**
- Success modal:
  - "Campaign Created Successfully! 🎉"
  - Campaign ID
  - Share link (with copy button)
  - Social share buttons
  - "View My Campaign" button
  - "Create Another" button

**Form Validation:**
- Real-time field validation
- Error messages inline
- Cannot proceed to next step with errors
- Save draft functionality (localStorage)

---

#### 3.2 Founder Dashboard
**Route:** `/founder/dashboard` or `/my-campaigns`

**Purpose:** Manage all founder campaigns and actions

**Components:**

**Portfolio Overview Cards:**
- Total Campaigns Created
- Active Campaigns
- Completed Campaigns
- Total Raised (ETH + USD)
- Total Received (from approved milestones)
- Pending Funds (locked in reserves/committed)

**Pending Actions Section:**
- "⚠️ Action Required" badges
- Campaigns needing milestone submission:
  - Campaign name
  - Current milestone
  - Days until deadline
  - "Submit Now" button

**Campaigns List (Tabs):**
- All Campaigns
- Active / Funding
- In Progress (milestones)
- Voting Phase
- Completed
- Failed / Paused

**Campaign Cards:**
Each card shows:
- Campaign title
- Funding progress: X/Y ETH (Z%)
- Number of funders
- Current milestone: "M2 - Beta Development"
- Status badge with context:
  - 🟢 "Active - Awaiting Funding"
  - 🟡 "Fully Funded - Submit M0"
  - 🔵 "M2 Voting - 4 days left"
  - 🟣 "M1 Approved - Work on M2"
  - ✅ "Completed - All funds received"
  - 🔴 "Failed - Deadline exceeded"
- Voting preview (if in voting):
  - YES: X% / NO: Y%
  - Progress bar
- Quick actions:
  - "View Details"
  - "Submit Milestone" (if applicable)
  - "Finalize Voting" (if early finalization possible)
  - "Pause Campaign" (if active)

**Recent Activity:**
- New funders
- Milestone approvals
- Fund releases
- Voting status updates

**Earnings History:**
- Timeline of fund releases
- Milestone X approved → Y ETH received
- Transaction hashes
- Total earnings graph

---

#### 3.3 Campaign Management Page (Founder View)
**Route:** `/founder/campaign/[campaignId]`

**Purpose:** Detailed campaign management and monitoring

**Components:**

**Campaign Header:**
- Campaign title (editable if no funders yet)
- Campaign ID
- Creation date
- Current state badge

**Tabs:**

**Tab 1: Overview**
- Funding progress
  - Visual progress bar
  - Current: X ETH / Goal: Y ETH (Z%)
  - Number of funders: N
- Milestones roadmap (visual timeline)
  - All 5 milestones with status
  - Dates and deadlines
  - Release percentages
- Current milestone focus:
  - "You are on: Milestone 2"
  - Description
  - Deadline countdown
  - Status
  - Action button (Submit / View Voting / Celebrate Approval)

**Tab 2: Funders**
- Funders table:
  - Address (truncated)
  - Amount contributed
  - Risk profile
  - Voting participation rate
  - Date funded
- Total committed funds: X ETH
- Total reserve funds: Y ETH
- Download funders CSV

**Tab 3: Milestones**
- Detailed list of all 5 milestones:

For each milestone:
- Milestone header (number, description)
- Deadline date
- Release percentage
- Status badge
- Evidence (if submitted):
  - IPFS link
  - Submission date
  - View evidence button
- Voting stats (if in voting):
  - YES: X ETH (Y%)
  - NO: A ETH (B%)
  - Participation: C/D funders
  - Time remaining
  - "Finalize Early" button (if >60% and enough participation)
- Result (if finalized):
  - Approved ✅ / Rejected ❌
  - Final vote: X% YES
  - Funds released: Y ETH
  - Transaction hash
- Action button:
  - "Submit Milestone" (if pending)
  - "Resubmit" (if rejected once)
  - "View Voting" (if in voting)

**Tab 4: Activity**
- Full timeline of campaign events:
  - Campaign created
  - First funder
  - Funding milestones (25%, 50%, 75%, 100%)
  - Milestone submissions
  - Voting periods
  - Results
  - Fund releases
  - All transactions

**Tab 5: Settings**
- Campaign status:
  - Current state
  - Pause/Unpause button (if applicable)
- Share campaign:
  - Campaign link (copy button)
  - QR code
  - Social share buttons
- Analytics (optional):
  - Views
  - Unique visitors
  - Conversion rate

**Floating Action Panel:**
- Context-aware primary action:
  - "Submit Milestone X" (if ready)
  - "View Voting Results" (if in voting)
  - "Celebrate! 🎉" (if milestone approved)
  - "Review Rejection" (if milestone rejected)

---

#### 3.4 Submit Milestone Page
**Route:** `/founder/campaign/[campaignId]/submit/[milestoneIndex]`

**Purpose:** Submit milestone evidence for voting

**Components:**

**Milestone Context:**
- Milestone number and description
- Original deadline
- Days remaining / Days used
- Release percentage (X% of committed pool)
- Potential earnings: Y ETH (if approved)

**Submission Form:**

**Evidence Upload:**
- IPFS upload section:
  - Drag & drop file upload
  - Supported formats: Images, PDFs, ZIP files
  - Max size: 100MB
  - "Upload to IPFS" button
  - OR manually enter IPFS hash input
  
- Upload progress indicator
- IPFS hash display (once uploaded)
- Preview uploaded content
- "Test IPFS Link" button (opens in new tab)

**Evidence Description:**
- Textarea for milestone completion description
  - Max 500 chars
  - Markdown support
  - What was delivered
  - How it meets milestone criteria
  - Additional notes for voters

**Submission Checklist:**
- ☑️ Evidence uploaded to IPFS
- ☑️ IPFS link working and accessible
- ☑️ Description provided
- ☑️ Before deadline
- ☑️ Ready for 7-day voting period

**Review Before Submit:**
- Summary of submission:
  - Milestone: X
  - IPFS Hash: [hash]
  - Description: [text]
  - Deadline status: X days early
- "Submit for Voting" button (primary, large)

**Confirmation Modal:**
- "Are you sure you want to submit?"
- "This will start a 7-day voting period"
- "Funders will review your evidence"
- Confirm / Cancel

**Post-Submission:**
- Success message:
  - "Milestone X Submitted! 🎉"
  - "Voting period: [start] to [end]"
  - "Funders have 7 days to vote"
- "View Voting Progress" button
- "Back to Campaign" button

**Resubmission Flow (if rejected once):**
- Warning banner:
  - "⚠️ This milestone was rejected once"
  - "Review feedback before resubmitting"
  - "A second rejection will fail the campaign"
- Previous submission history:
  - Previous IPFS hash
  - Previous vote result
  - Lessons learned / improvements made

---

### 4. SHARED PAGES

#### 4.1 Wallet Connection Modal
**Component:** Modal/Overlay (not a separate page)

**Purpose:** Connect Web3 wallet

**Components:**
- Wallet options:
  - MetaMask
  - Coinbase Wallet
  - WalletConnect
  - Rainbow
  - Other injected wallets
- Each option shows:
  - Wallet logo
  - Wallet name
  - "Connect" button
- Connection status:
  - Connecting spinner
  - Success message
  - Error message (if failed)
- Network check:
  - "Switch to Base Sepolia" (if wrong network)
- Post-connection:
  - Display connected address (truncated)
  - Display wallet balance (ETH)
  - Disconnect option

---

#### 4.2 User Profile/Account Page
**Route:** `/account` or `/profile`

**Purpose:** View account information and settings

**Components:**

**Wallet Information:**
- Connected wallet address (full + copy button)
- ENS name (if available)
- Wallet balance (ETH + USD)
- Network: Base Sepolia

**User Statistics:**
- As Investor:
  - Total invested: X ETH
  - Active investments: N campaigns
  - Voting participation rate: Y%
  - Refunds claimed: Z ETH
  
- As Founder:
  - Campaigns created: N
  - Total raised: X ETH
  - Total received: Y ETH
  - Success rate: Z%

**Transaction History:**
- All blockchain transactions:
  - Type (Fund, Vote, Refund, Create, Submit, etc.)
  - Campaign
  - Amount (if applicable)
  - Date
  - Transaction hash (link to explorer)
  - Status

**Settings:**
- Email notifications (if implemented):
  - Milestone submissions
  - Voting reminders
  - Campaign updates
- Theme preference (dark/light mode)
- Currency display (ETH/USD)

**Account Actions:**
- Disconnect wallet button
- Export transaction history (CSV)

---

#### 4.3 Notifications Page
**Route:** `/notifications`

**Purpose:** View all notifications and alerts

**Components:**

**Notification Filters:**
- All
- Unread
- Action Required
- Campaigns
- Voting
- Transactions

**Notification List:**
Each notification shows:
- Icon (based on type)
- Title
- Description
- Time ago
- Read/Unread indicator
- Action button (if applicable)
- Mark as read

**Notification Types:**

For Investors:
- 🔔 New milestone submitted on [Campaign] - "Vote Now"
- ✅ Milestone approved on [Campaign]
- ❌ Milestone rejected on [Campaign]
- 💰 Refund available for [Campaign] - "Claim Now"
- ⚠️ Voting deadline approaching - "Vote within 24h"
- 🎉 Campaign completed successfully
- 📊 You've been put in Auto-YES mode on [Campaign]

For Founders:
- 💰 New funder contributed X ETH
- 🎯 Funding goal reached!
- ⏰ Milestone deadline approaching (7 days)
- 🗳️ Voting period started for Milestone X
- ✅ Milestone X approved! Y ETH released
- ❌ Milestone X rejected - Review and resubmit
- ⚠️ Last chance: 1 rejection remaining
- 🎉 All milestones completed! Campaign success

**Mark All as Read:**
- Button to clear all unread

**Notification Settings:**
- Link to profile settings for preferences

---

#### 4.4 About/How It Works Page
**Route:** `/about` or `/how-it-works`

**Purpose:** Explain platform mechanics

**Components:**

**Overview Section:**
- Platform introduction
- Mission and vision
- Key benefits

**How It Works (For Investors):**
- Step-by-step guide:
  1. Browse projects
  2. Choose risk profile
  3. Fund campaign
  4. Vote on milestones
  5. Project success or refund
- Risk profile explanation (50/50, 70/30, 90/10)
- Voting mechanism explanation
- Refund process

**How It Works (For Founders):**
- Step-by-step guide:
  1. Create campaign
  2. Define 5 milestones
  3. Raise funds
  4. Deliver milestones
  5. Receive funds incrementally
- Milestone requirements
- Voting approval process
- Best practices

**Key Features:**
- Milestone-based funding
- Risk profiles
- Voting mechanism
- Anti-whale protection
- Refund protection
- Smart contract security

**FAQ Section:**
- Common questions and answers
- Technical details
- Fee structure

**Documentation Links:**
- Smart contract addresses
- GitHub repository
- Audit reports
- Terms of service

---

#### 4.5 Error Pages

**404 Not Found**
- "Campaign Not Found" or "Page Not Found"
- Search functionality
- Browse campaigns button
- Home button

**500 Server Error**
- "Something went wrong"
- Retry button
- Contact support

**Wallet Error**
- "Wrong Network"
  - "Please switch to Base Sepolia"
  - Switch network button
  
- "Wallet Not Connected"
  - Connect wallet button
  
- "Transaction Failed"
  - Error message
  - Retry button

---

## 🗺️ Site Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER/NAVBAR                            │
├─────────────────────────────────────────────────────────────────┤
│ Logo │ Browse │ Create │ [If Connected: My Investments/Campaigns]│
│                                         [Wallet Button] [Profile]│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         MAIN CONTENT                             │
│                     [Dynamic Page Content]                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           FOOTER                                 │
├─────────────────────────────────────────────────────────────────┤
│ About │ How It Works │ Docs │ GitHub │ Social Links              │
│ © 2025 Web3 Milestone Crowdfunding Platform                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Page Priority Matrix

### Phase 1: MVP (Essential)
**Must have for launch:**
1. ✅ Landing/Home Page
2. ✅ Browse Projects Page
3. ✅ Campaign Details Page (Investor View)
4. ✅ Create Campaign Page (Founder)
5. ✅ Founder Dashboard / My Campaigns
6. ✅ Submit Milestone Page
7. ✅ Voting Interface (on Campaign Details)
8. ✅ Wallet Connection Modal

### Phase 2: Core Features (Important)
**Needed for full functionality:**
9. ✅ My Investments Dashboard (Investor)
10. ✅ Campaign Management Page (Founder)
11. ✅ Refund Claim Page
12. ✅ Account/Profile Page
13. ✅ Error Pages (404, Wrong Network)

### Phase 3: Enhancement (Nice to Have)
**Improves user experience:**
14. ⭐ Dedicated Voting Page (separate from campaign details)
15. ⭐ Notifications Page
16. ⭐ About/How It Works Page
17. ⭐ Advanced Search/Filters
18. ⭐ Campaign Analytics

---

## 🎨 UI/UX Considerations

### Responsive Design
- Mobile-first approach
- Breakpoints: Mobile (< 640px), Tablet (640-1024px), Desktop (> 1024px)
- Touch-friendly buttons on mobile
- Collapsible sections on mobile

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Alt text for images
- ARIA labels

### Loading States
- Skeleton screens for data loading
- Loading spinners for transactions
- Progress indicators for multi-step forms
- Optimistic UI updates where possible

### Error Handling
- Clear error messages
- Action-oriented error states
- Fallback UI for failed loads
- Transaction error handling

### Real-time Updates
- WebSocket or polling for:
  - Voting stats
  - Funding progress
  - Milestone submissions
  - Transaction confirmations
- Notification badges
- Live countdown timers

---

## 🔗 Page Routing Summary

```
/                                    → Landing Page
/browse                              → Browse Projects
/campaign/:id                        → Campaign Details (Investor)
/campaign/:id/vote/:milestoneIndex   → Voting Page
/campaign/:id/refund                 → Refund Claim

/create-campaign                     → Create Campaign (Founder)
/founder/dashboard                   → Founder Dashboard
/founder/campaign/:id                → Campaign Management (Founder)
/founder/campaign/:id/submit/:milestone → Submit Milestone

/investor/dashboard                  → My Investments (Investor)
/account                            → User Profile/Account
/notifications                      → Notifications
/about                              → About/How It Works

/404                                → Not Found
```

---

## 💾 State Management Requirements

### Global State (Context/Redux)
- Connected wallet address
- Network information
- User type (investor/founder/both)
- Notification count
- Theme preference

### Per-Page State
- Form inputs (with validation)
- Loading states
- Error states
- Modal visibility
- Filter/sort preferences

### Blockchain State (from Smart Contract)
- Campaign data
- User contributions
- Voting data
- Milestone statuses
- Transaction history

---

## 📱 Mobile Considerations

### Mobile-Specific Features
- Bottom sheet modals (instead of center modals)
- Swipeable campaign cards
- Pull-to-refresh on lists
- Native-like navigation (bottom tab bar)
- Condensed information hierarchy
- Mobile wallet app integration

### Mobile Optimizations
- Lazy loading images
- Infinite scroll instead of pagination
- Compressed data transfers
- Cached data for offline viewing
- Reduced animation on low-end devices

---

## ✅ Page Checklist Summary

**Total Pages: 18+**

**Core Pages (8):**
- [x] Landing/Home
- [x] Browse Projects
- [x] Campaign Details (Investor)
- [x] My Investments Dashboard
- [x] Create Campaign
- [x] Founder Dashboard
- [x] Campaign Management (Founder)
- [x] Submit Milestone

**Action Pages (3):**
- [x] Voting Page
- [x] Refund Claim
- [x] Wallet Connection

**Supporting Pages (7):**
- [x] Account/Profile
- [x] Notifications
- [x] About/How It Works
- [x] 404 Not Found
- [x] Wrong Network Error
- [x] Transaction Failed
- [x] Loading States

---

**Created:** Based on USER_FLOW_DIAGRAM.md analysis  
**Last Updated:** October 20, 2025  
**Version:** 1.0

**Next Steps:**
1. Create wireframes for each page
2. Design UI mockups
3. Define component structure
4. Implement pages in priority order (Phase 1 → 2 → 3)

