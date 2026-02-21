# Stafferoo, build spec for agents

# 

# Non negotiables

# Next.js app router

# TypeScript strict

# Zod validation for all inputs

# Robust error handling

# Feature flags by default for risky features

# Observability first, structured logs plus audit events

# Postgres with migrations

# Background tasks via jobs table and Node worker process

# Email sending uses Resend for invoices

# 

# Permanent git workflow, mandatory

# Branch per slice is mandatory.

# Never commit on main.

# Never push to main.

# Never merge to main.

# All work happens on a slice branch, then you stop and tell me the exact merge steps.

# 

# Branch naming

# Use: slice\_<3 digit number>\_<short\_slug>

# Underscores only.

# 

# Before any code changes

# You must create and switch to a slice branch using the repo helper:

# powershell -ExecutionPolicy Bypass -File scripts\\new\_slice\_branch.ps1 <SliceNumber> <Slug>

# 

# Repo enforced guardrails

# This repo uses local git hooks to enforce the rules.

# If hooks are not active, activate them before doing any work:

# git config core.hooksPath .githooks

# 

# Roles and naming

# Call workers, staff

# Organisations are settings

# Admin is platform operator

# 

# Current gates

# Always run this after every change:

# npm run gate

# 

# Gate definition:

# npm run lint

# npm run build

# npm run test

# 

# Development workflow

# Small slices only

# Do not mark done until gates pass

# Prefer whole file replacements

# Avoid adding new dependencies unless required

# 

# Output requirements

# When you change code:

# 1\. List files changed

# 2\. Provide whole file replacements for every file changed

# 3\. Provide exact commands to run gates

# 4\. If a gate fails, fix it on the same slice branch

# 5\. Do not continue to another slice until this slice passes gates

# 

# Current product rules

# Settings can sign up but are not live until their postcode is enabled by admin

# Admin dashboard flags density of staff and settings by postcode

# Staff onboarding includes DBS update service number and consent

# Verification runs via background worker, stores valid, invalid, or manual review

# 

# Pricing

# Standard, 249 per setting per month

# Multi site, 249 plus 99 per additional location

# Enterprise, uplift with advanced governance, approvals, audit, reporting, integrations, priority support

# Usage charge, 23 per hour for settings

# 

# Definition of done

# Work committed on a slice branch

# Gates pass

# Validation and error handling added

# Migrations reversible

# Audit log events for sensitive actions

# I have merged the slice into main after review

