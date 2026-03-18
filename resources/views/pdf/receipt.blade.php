<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Payment Receipt</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            font-size: 12px;
            line-height: 1.5;
        }
        .container {
            max-width: 760px;
            margin: 0 auto;
        }
        .header {
            border-bottom: 2px solid #0f172a;
            margin-bottom: 20px;
            padding-bottom: 8px;
        }
        .title {
            font-size: 22px;
            margin: 0;
        }
        .subtitle {
            color: #475569;
            margin-top: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            text-align: left;
            padding: 10px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
        }
        th {
            background: #f8fafc;
            width: 34%;
            font-weight: 700;
        }
        .section-title {
            margin: 16px 0 4px;
            font-size: 14px;
            font-weight: 700;
        }
        .amount {
            font-size: 20px;
            font-weight: 700;
        }
        .footer {
            margin-top: 24px;
            color: #64748b;
            font-size: 11px;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1 class="title">KCAU Events Payment Receipt</h1>
        <p class="subtitle">Official proof of payment</p>
    </div>

    <p class="section-title">Receipt Details</p>
    <table>
        <tr>
            <th>Receipt Number</th>
            <td>{{ $payment->mpesa_receipt_number }}</td>
        </tr>
        <tr>
            <th>Payment ID</th>
            <td>#{{ $payment->id }}</td>
        </tr>
        <tr>
            <th>Order ID</th>
            <td>#{{ $order?->id }}</td>
        </tr>
        <tr>
            <th>Paid By</th>
            <td>{{ $user?->name }} ({{ $user?->email }})</td>
        </tr>
        <tr>
            <th>Phone Number</th>
            <td>{{ $payment->phone_number }}</td>
        </tr>
        <tr>
            <th>Item</th>
            <td>{{ $orderableName }}</td>
        </tr>
        <tr>
            <th>Status</th>
            <td>{{ strtoupper((string) $payment->status->value) }}</td>
        </tr>
        <tr>
            <th>Paid At</th>
            <td>{{ optional($payment->paid_at)?->timezone('Africa/Nairobi')?->format('F j, Y g:i A') ?? 'N/A' }}</td>
        </tr>
        <tr>
            <th>Amount</th>
            <td class="amount">{{ $payment->formattedAmount() }}</td>
        </tr>
    </table>

    <p class="footer">
        Generated on {{ now()->timezone('Africa/Nairobi')->format('F j, Y g:i A') }}.
        Keep this receipt for your records.
    </p>
</div>
</body>
</html>
